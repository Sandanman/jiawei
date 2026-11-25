/**
 * 管理端菜品服务（F3）
 */
import { query, queryOne, withTransaction } from '../../db'
import { BizError } from '../../utils/bizError'
import { writeAudit } from './auditService'
import { escapeLike, toNumber } from '../../controllers/admin/_common'
import { formatDateTime } from '../../utils/format'
import type { AdminIdentity } from '../../types/admin'

interface ListOptions {
    familyId?: string
    keyword?: string
    category?: string
    isPublished?: string
    soldOut?: string
    page: number
    pageSize: number
    offset: number
}

interface DishQueryRow {
    id: number
    family_id: number
    family_name: string | null
    name: string
    description: string
    price: string
    points: number
    category: string
    image_url: string
    stock: number
    is_published: number
    sort_order: number
    created_at: string | Date
    updated_at: string | Date
}

function mapDishRow(row: DishQueryRow): any {
    return {
        id: row.id,
        familyId: row.family_id,
        familyName: row.family_name || '',
        name: row.name,
        description: row.description || '',
        price: Number(row.price),
        points: toNumber(row.points),
        category: row.category || '',
        imageUrl: row.image_url || '',
        stock: toNumber(row.stock),
        isPublished: toNumber(row.is_published),
        sortOrder: toNumber(row.sort_order),
        createdAt: formatDateTime(row.created_at),
        updatedAt: formatDateTime(row.updated_at)
    }
}

/** 菜品列表与搜索（跨家庭） */
export async function listDishes(opts: ListOptions): Promise<{
    list: any[]
    total: number
    page: number
    pageSize: number
}> {
    const conditions: string[] = []
    const params: any[] = []

    const familyId = Number(opts.familyId)
    if (Number.isFinite(familyId) && familyId > 0) {
        conditions.push('d.family_id = ?')
        params.push(familyId)
    }

    const keyword = (opts.keyword || '').trim()
    if (keyword) {
        conditions.push('d.name LIKE ?')
        params.push(`%${escapeLike(keyword)}%`)
    }

    if (opts.category) {
        conditions.push('d.category = ?')
        params.push(opts.category)
    }

    if (opts.isPublished === '0' || opts.isPublished === '1') {
        conditions.push('d.is_published = ?')
        params.push(Number(opts.isPublished))
    }

    if (opts.soldOut === '1') {
        conditions.push('d.stock = 0')
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM dish d ${where}`,
        params
    )

    const rows = await query<DishQueryRow[]>(
        `SELECT d.*, f.family_name
         FROM dish d
         LEFT JOIN family f ON f.id = d.family_id
         ${where}
         ORDER BY d.created_at DESC, d.id DESC
         LIMIT ? OFFSET ?`,
        [...params, opts.pageSize, opts.offset]
    )

    return {
        list: rows.map(mapDishRow),
        total: toNumber(countRow?.total),
        page: opts.page,
        pageSize: opts.pageSize
    }
}

/** 菜品详情 */
export async function getDishDetail(dishId: number): Promise<any> {
    const row = await queryOne<DishQueryRow>(
        `SELECT d.*, f.family_name
         FROM dish d
         LEFT JOIN family f ON f.id = d.family_id
         WHERE d.id = ?`,
        [dishId]
    )
    if (!row) throw new BizError('菜品不存在')
    return mapDishRow(row)
}

interface FieldDefinition {
    column: string
    validate: (value: any) => any
}

const DISH_FIELDS: Record<string, FieldDefinition> = {
    name: {
        column: 'name',
        validate: value => {
            const text = String(value ?? '').trim()
            if (text.length < 1 || text.length > 64) throw new BizError('菜品名称需为 1-64 个字符')
            return text
        }
    },
    description: {
        column: 'description',
        validate: value => {
            const text = String(value ?? '')
            if (text.length > 512) throw new BizError('描述不能超过 512 个字符')
            return text
        }
    },
    price: {
        column: 'price',
        validate: value => {
            const text = String(value ?? '').trim()
            if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new BizError('价格不合法')
            return Number(text)
        }
    },
    points: {
        column: 'points',
        validate: value => {
            const num = Number(value)
            if (!Number.isInteger(num) || num < 0) throw new BizError('积分不合法')
            return num
        }
    },
    category: {
        column: 'category',
        validate: value => {
            const text = String(value ?? '').trim()
            if (text.length > 32) throw new BizError('分类不能超过 32 个字符')
            return text
        }
    },
    imageUrl: {
        column: 'image_url',
        validate: value => {
            const text = String(value ?? '').trim()
            if (text.length > 512) throw new BizError('图片地址不能超过 512 个字符')
            if (text && !/^https?:\/\//i.test(text)) throw new BizError('图片地址需以 http/https 开头')
            return text
        }
    },
    stock: {
        column: 'stock',
        validate: value => {
            const num = Number(value)
            if (!Number.isInteger(num) || num < 0) throw new BizError('库存不合法')
            return num
        }
    },
    sortOrder: {
        column: 'sort_order',
        validate: value => {
            const num = Number(value)
            if (!Number.isInteger(num) || num < 0) throw new BizError('排序值不合法')
            return num
        }
    }
}

const DISH_DETAIL_COLUMNS = [
    'name', 'description', 'price', 'points', 'category', 'image_url', 'stock', 'is_published', 'sort_order'
]

/** 编辑菜品 */
export async function updateDish(
    admin: AdminIdentity,
    dishId: number,
    body: any,
    ip: string
): Promise<void> {
    const dish = await queryOne<Record<string, any>>(`SELECT * FROM dish WHERE id = ?`, [dishId])
    if (!dish) throw new BizError('菜品不存在')

    const before: Record<string, any> = {}
    const after: Record<string, any> = {}
    const sets: string[] = []
    const params: any[] = []

    for (const [key, definition] of Object.entries(DISH_FIELDS)) {
        if (body?.[key] === undefined) continue
        const nextValue = definition.validate(body[key])
        const prevValue = dish[definition.column]
        const comparablePrev = typeof nextValue === 'number' ? Number(prevValue) : (prevValue ?? '')
        if (comparablePrev === nextValue) continue

        before[key] = comparablePrev
        after[key] = nextValue
        sets.push(`${definition.column} = ?`)
        params.push(nextValue)
    }

    if (sets.length === 0) {
        throw new BizError('没有可更新的内容')
    }

    await withTransaction(async conn => {
        await conn.query(
            `UPDATE dish SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`,
            [...params, dishId]
        )
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'dish.update',
            targetType: 'dish',
            targetId: dishId,
            familyId: dish.family_id,
            ip,
            before,
            after
        })
    })
}

/** 上架 / 下架 */
export async function publishDish(
    admin: AdminIdentity,
    dishId: number,
    isPublished: boolean,
    ip: string
): Promise<void> {
    const dish = await queryOne<{ id: number; family_id: number; is_published: number }>(
        `SELECT id, family_id, is_published FROM dish WHERE id = ?`,
        [dishId]
    )
    if (!dish) throw new BizError('菜品不存在')

    const target = isPublished ? 1 : 0

    await withTransaction(async conn => {
        await conn.query(`UPDATE dish SET is_published = ?, updated_at = NOW() WHERE id = ?`, [
            target,
            dishId
        ])
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'dish.publish',
            targetType: 'dish',
            targetId: dishId,
            familyId: dish.family_id,
            ip,
            before: { isPublished: dish.is_published },
            after: { isPublished: target }
        })
    })
}

/** 删除菜品（高危） */
export async function deleteDish(
    admin: AdminIdentity,
    dishId: number,
    reason: string,
    ip: string
): Promise<void> {
    const dish = await queryOne<Record<string, any>>(`SELECT * FROM dish WHERE id = ?`, [dishId])
    if (!dish) throw new BizError('菜品不存在')

    const [rewardRow, orderRow] = await Promise.all([
        queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM reward WHERE dish_id = ?`, [dishId]),
        queryOne<{ total: number }>(
            `SELECT COUNT(DISTINCT o.id) AS total
             FROM order_item oi
             INNER JOIN \`order\` o ON o.id = oi.order_id
             WHERE oi.dish_id = ? AND o.status IN ('pending','confirmed')`,
            [dishId]
        )
    ])

    const rewardCount = toNumber(rewardRow?.total)
    const openOrderCount = toNumber(orderRow?.total)

    if (rewardCount > 0 || openOrderCount > 0) {
        throw new BizError('该菜品仍被引用，请先下架', { rewardCount, openOrderCount })
    }

    // 记录完整字段，便于人工还原
    const beforeData: Record<string, any> = {}
    for (const column of DISH_DETAIL_COLUMNS) {
        beforeData[column] = dish[column]
    }
    beforeData.id = dish.id
    beforeData.familyId = dish.family_id

    await withTransaction(async conn => {
        await conn.query(`DELETE FROM dish WHERE id = ?`, [dishId])
        await writeAudit(conn, {
            adminId: admin.id,
            adminName: admin.username,
            action: 'dish.delete',
            targetType: 'dish',
            targetId: dishId,
            familyId: dish.family_id,
            reason,
            ip,
            before: beforeData,
            after: null
        })
    })
}

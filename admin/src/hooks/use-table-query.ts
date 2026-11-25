/**
 * 列表页通用查询状态：筛选条件 + 分页 + 请求
 * fetcher 与初始筛选放在 ref 中，调用方无需 useCallback 也不会触发重复请求
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PagedResult } from '../api/types'

export interface TableQueryResult<T, F extends Record<string, any>> {
    data: T[]
    total: number
    loading: boolean
    page: number
    pageSize: number
    filters: F
    search: (next: F) => void
    reset: () => void
    reload: () => void
    changePage: (page: number, pageSize: number) => void
}

export function useTableQuery<T, F extends Record<string, any>>(
    fetcher: (params: F & { page: number; pageSize: number }) => Promise<PagedResult<T>>,
    initialFilters: F
): TableQueryResult<T, F> {
    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const initialRef = useRef(initialFilters)

    const [filters, setFilters] = useState<F>(initialFilters)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [data, setData] = useState<T[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const seqRef = useRef(0)

    const load = useCallback(async () => {
        const seq = ++seqRef.current
        setLoading(true)
        try {
            const result = await fetcherRef.current({ ...filters, page, pageSize })
            if (seq !== seqRef.current) return
            setData(result.list)
            setTotal(result.total)
        } catch {
            if (seq === seqRef.current) {
                setData([])
                setTotal(0)
            }
        } finally {
            if (seq === seqRef.current) setLoading(false)
        }
    }, [filters, page, pageSize])

    useEffect(() => {
        void load()
    }, [load])

    const search = useCallback((next: F) => {
        setPage(1)
        setFilters(next)
    }, [])

    const reset = useCallback(() => {
        setPage(1)
        setFilters(initialRef.current)
    }, [])

    const changePage = useCallback((nextPage: number, nextPageSize: number) => {
        setPage(nextPage)
        setPageSize(nextPageSize)
    }, [])

    return {
        data,
        total,
        loading,
        page,
        pageSize,
        filters,
        search,
        reset,
        reload: load,
        changePage
    }
}

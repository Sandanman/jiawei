import { Tag } from 'antd'
import {
    DISH_PUBLISH,
    FAMILY_STATUS,
    ORDER_STATUS,
    REWARD_STATUS,
    USER_STATUS
} from '../../utils/constants'

type StatusType = 'family' | 'user' | 'dishPublish' | 'order' | 'reward'

interface StatusTagProps {
    type: StatusType
    value: number | string
}

const TAG_COLORS: Record<string, string> = {
    success: 'green',
    warning: 'orange',
    processing: 'blue',
    error: 'red',
    default: 'default'
}

/** 状态标签：所有页面共用同一套文案与配色 */
export default function StatusTag({ type, value }: StatusTagProps) {
    const dictByType: Record<StatusType, Record<string | number, { label: string; color: string }>> = {
        family: FAMILY_STATUS,
        user: USER_STATUS,
        dishPublish: DISH_PUBLISH,
        order: ORDER_STATUS,
        reward: REWARD_STATUS
    }

    const dict = dictByType[type]
    const item = dict[value]

    if (!item) {
        return <Tag>{String(value)}</Tag>
    }

    return <Tag color={TAG_COLORS[item.color] || item.color}>{item.label}</Tag>
}

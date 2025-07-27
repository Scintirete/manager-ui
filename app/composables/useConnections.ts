import type { ConnectionConfig } from './useApi'

export function useConnections() {
  const connections = ref<ConnectionConfig[]>([])
  
  // 从localStorage加载连接配置
  const loadConnections = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scintirete-connections')
      if (stored) {
        try {
          connections.value = JSON.parse(stored)
        } catch (error) {
          console.error('Failed to parse stored connections:', error)
          connections.value = []
        }
      }
    }
  }

  // 保存连接配置到localStorage
  const saveConnections = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('scintirete-connections', JSON.stringify(connections.value))
    }
  }

  // 生成唯一ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 添加连接
  const addConnection = (connection: Omit<ConnectionConfig, 'id'>): ConnectionConfig => {
    const newConnection: ConnectionConfig = {
      ...connection,
      id: generateId(),
      name: connection.name || `${connection.server}:${connection.port}`
    }
    connections.value.push(newConnection)
    saveConnections()
    return newConnection
  }

  // 更新连接
  const updateConnection = (id: string, updates: Partial<ConnectionConfig>): boolean => {
    const index = connections.value.findIndex(conn => conn.id === id)
    if (index !== -1) {
      connections.value[index] = { ...connections.value[index], ...updates } as ConnectionConfig
      saveConnections()
      return true
    }
    return false
  }

  // 删除连接
  const removeConnection = (id: string): boolean => {
    const index = connections.value.findIndex(conn => conn.id === id)
    if (index !== -1) {
      connections.value.splice(index, 1)
      saveConnections()
      return true
    }
    return false
  }

  // 获取连接
  const getConnection = (id: string): ConnectionConfig | undefined => {
    return connections.value.find(conn => conn.id === id)
  }

  // 初始化时加载连接
  onMounted(() => {
    loadConnections()
  })

  return {
    connections: readonly(connections),
    addConnection,
    updateConnection,
    removeConnection,
    getConnection,
    loadConnections
  }
} 
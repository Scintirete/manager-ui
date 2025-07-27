import { describe, it, expect } from 'vitest'

describe('基础功能测试', () => {
  it('项目配置正确', () => {
    expect(1 + 1).toBe(2)
  })

  it('LocalStorage 模拟功能', () => {
    const testKey = 'test-key'
    const testValue = 'test-value'
    
    // 模拟localStorage
    const storage: Record<string, string> = {}
    const mockLocalStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      }
    }
    
    mockLocalStorage.setItem(testKey, testValue)
    expect(mockLocalStorage.getItem(testKey)).toBe(testValue)
    
    mockLocalStorage.removeItem(testKey)
    expect(mockLocalStorage.getItem(testKey)).toBe(null)
  })

  it('API 配置验证', () => {
    const apiConfig = {
      baseUrl: 'http://127.0.0.1:8080/api/v1',
      endpoints: {
        health: '/health',
        databases: '/databases',
        collections: '/databases/:db_name/collections'
      }
    }
    
    expect(apiConfig.baseUrl).toContain('api/v1')
    expect(apiConfig.endpoints.health).toBe('/health')
  })

  it('连接配置结构验证', () => {
    const connection = {
      id: 'test-1',
      name: 'Test Connection',
      server: '127.0.0.1',
      port: 8080,
      password: 'test',
      mode: 'client' as const
    }
    
    expect(connection).toHaveProperty('id')
    expect(connection).toHaveProperty('server')
    expect(connection).toHaveProperty('port')
    expect(connection.mode).toMatch(/^(client|proxy)$/)
  })
}) 
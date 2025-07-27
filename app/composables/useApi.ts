import type { 
  AuthInfo, 
  ListDatabasesRequest, 
  ListDatabasesResponse,
  ListCollectionsRequest,
  ListCollectionsResponse,
  ListEmbeddingModelsRequest,
  ListEmbeddingModelsResponse,
  EmbedAndInsertRequest,
  EmbedAndInsertResponse,
  EmbedAndSearchRequest,
  SearchResponse,
  DeleteVectorsRequest,
  DeleteVectorsResponse
} from '../../types/scintirete'

// 连接配置接口
export interface ConnectionConfig {
  id?: string
  server: string
  port: number
  password: string
  mode: 'client' | 'proxy'
  name?: string
}

// API 请求选项
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  data?: any
  headers?: Record<string, string>
}

// 统一的API请求参数
interface ApiRequest {
  baseUrl: string
  endpoint: string
  method: 'GET' | 'POST' | 'DELETE'
  data?: any
  headers?: Record<string, string>
}

// 动态导入axios（仅在浏览器环境中）
const getAxios = async () => {
  if (typeof window === 'undefined') {
    throw new Error('axios只能在浏览器环境中使用')
  }
  const { default: axios } = await import('axios')
  return axios.create({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 统一的API请求方法
export function useApi() {
  const config = useRuntimeConfig()
  
  // 当前连接配置
  const currentConnection = ref<ConnectionConfig | null>(null)
  
  // 设置当前连接
  const setConnection = (connection: ConnectionConfig) => {
    currentConnection.value = connection
  }

  // 构建认证信息
  const buildAuth = (): AuthInfo => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }
    return {
      password: currentConnection.value.password
    }
  }

  // 构建基础URL
  const buildBaseUrl = (): string => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }
    return `http://${currentConnection.value.server}:${currentConnection.value.port}/api/v1`
  }

  // 统一的请求方法
  const apiRequest = async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }

    const { method = 'GET', data, headers = {} } = options

    try {
      // 构建统一的请求参数
      const requestData: ApiRequest = {
        baseUrl: buildBaseUrl(),
        endpoint,
        method,
        data,
        headers
      }

      if (currentConnection.value.mode === 'proxy' && config.public.enableServerProxy) {
        // 服务器转发模式 - 统一使用代理接口
        return await $fetch<T>('/api/proxy', {
          method: 'POST',
          body: requestData
        })
      } else {
        // 客户端直连模式 - 仅在浏览器中使用
        if (typeof window === 'undefined') {
          throw new Error('客户端直连模式只能在浏览器中使用')
        }
        
        const axiosInstance = await getAxios()
        const url = `${requestData.baseUrl}${requestData.endpoint}`
        const axiosConfig: any = {
          url,
          method: requestData.method.toLowerCase(),
          headers: {
            'Content-Type': 'application/json',
            ...requestData.headers
          },
          timeout: 30000 // 30秒超时
        }

        // GET 请求不能有 body
        if (requestData.method.toUpperCase() !== 'GET' && requestData.data) {
          axiosConfig.data = requestData.data
        }

        const response = await axiosInstance(axiosConfig)
        return response.data
      }
    } catch (error: any) {
      console.error('API request failed:', error)
      
      // 统一错误处理
      if (error.code === 'ECONNREFUSED') {
        throw new Error('连接被拒绝，请检查服务器地址和端口')
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接')
      }
      
      if (error.response) {
        const message = error.response.data?.message || error.response.statusText || '请求失败'
        throw new Error(`${message} (${error.response.status})`)
      }
      
      if (error.data?.message) {
        throw new Error(error.data.message)
      }
      
      throw error
    }
  }

  // 健康检查
  const healthCheck = async (): Promise<boolean> => {
    try {
      await apiRequest('/health')
      return true
    } catch (error) {
      return false
    }
  }

  // 获取数据库列表
  const listDatabases = async (): Promise<ListDatabasesResponse> => {
    const auth = buildAuth()
    return await apiRequest<ListDatabasesResponse>('/databases', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.password}`
      }
    })
  }

  // 获取集合列表
  const listCollections = async (dbName: string): Promise<ListCollectionsResponse> => {
    const auth = buildAuth()
    return await apiRequest<ListCollectionsResponse>(`/databases/${dbName}/collections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.password}`
      }
    })
  }

  // 获取嵌入模型列表
  const listEmbeddingModels = async (): Promise<ListEmbeddingModelsResponse> => {
    const auth = buildAuth()
    return await apiRequest<ListEmbeddingModelsResponse>('/embed/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.password}`
      }
    })
  }

  // 嵌入并插入向量
  const embedAndInsert = async (
    dbName: string, 
    collectionName: string, 
    texts: { text: string; metadata: Record<string, any> }[], 
    embeddingModel?: string
  ): Promise<EmbedAndInsertResponse> => {
    const request: EmbedAndInsertRequest = {
      auth: buildAuth(),
      db_name: dbName,
      collection_name: collectionName,
      texts: texts.map(t => ({ text: t.text, metadata: t.metadata })),
      embedding_model: embeddingModel
    }
    return await apiRequest<EmbedAndInsertResponse>(`/databases/${dbName}/collections/${collectionName}/embed`, {
      method: 'POST',
      data: request
    })
  }

  // 嵌入并搜索向量
  const embedAndSearch = async (
    dbName: string,
    collectionName: string,
    queryText: string,
    topK: number,
    embeddingModel?: string,
    filter?: string
  ): Promise<SearchResponse> => {
    const request: EmbedAndSearchRequest = {
      auth: buildAuth(),
      db_name: dbName,
      collection_name: collectionName,
      query_text: queryText,
      top_k: topK,
      embedding_model: embeddingModel,
      filter: filter || ''
    }
    return await apiRequest<SearchResponse>(`/databases/${dbName}/collections/${collectionName}/embed/search`, {
      method: 'POST',
      data: request
    })
  }

  // 删除向量
  const deleteVectors = async (
    dbName: string,
    collectionName: string,
    ids: number[]
  ): Promise<DeleteVectorsResponse> => {
    const request: DeleteVectorsRequest = {
      auth: buildAuth(),
      db_name: dbName,
      collection_name: collectionName,
      ids
    }
    return await apiRequest<DeleteVectorsResponse>(`/databases/${dbName}/collections/${collectionName}/vectors`, {
      method: 'DELETE',
      data: request
    })
  }

  return {
    currentConnection: readonly(currentConnection),
    setConnection,
    healthCheck,
    listDatabases,
    listCollections,
    listEmbeddingModels,
    embedAndInsert,
    embedAndSearch,
    deleteVectors
  }
} 
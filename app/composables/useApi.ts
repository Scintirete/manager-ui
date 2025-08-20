import type { 
  AuthInfo, 
  ListDatabasesRequest, 
  ListDatabasesResponse,
  CreateDatabaseRequest,
  CreateDatabaseResponse,
  DropDatabaseRequest,
  DropDatabaseResponse,
  ListCollectionsRequest,
  ListCollectionsResponse,
  CreateCollectionRequest,
  CreateCollectionResponse,
  DropCollectionRequest,
  DropCollectionResponse,
  ListEmbeddingModelsRequest,
  ListEmbeddingModelsResponse,
  EmbedAndInsertRequest,
  EmbedAndInsertResponse,
  EmbedAndSearchRequest,
  SearchResponse,
  InsertVectorsRequest,
  InsertVectorsResponse,
  SearchRequest,
  DeleteVectorsRequest,
  DeleteVectorsResponse,
  DistanceMetric,
  HnswConfig
} from '~/types/scintirete.d.ts'

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

// 连接验证结果
interface ConnectionValidationResult {
  isHealthy: boolean
  isAuthenticated: boolean
  error?: string
}

// 动态导入axios（仅在浏览器环境中）
const getAxios = async () => {
  if (typeof window === 'undefined') {
    throw new Error('axios can only be used in browser environment')
  }
  // 使用 import() 语法避免 TypeScript 错误
  const axios = await import('axios')
  return axios.default.create({
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

  // 构建认证头信息 - 统一鉴权处理
  const buildAuthHeaders = (): Record<string, string> => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }
    return {
      'Authorization': `Bearer ${currentConnection.value.password}`
    }
  }

  // 构建基础URL
  const buildBaseUrl = (): string => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }
    return `http://${currentConnection.value.server}:${currentConnection.value.port}/api/v1`
  }

  // 统一的请求方法 - 自动处理鉴权
  const apiRequest = async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    if (!currentConnection.value) {
      throw new Error('No connection configured')
    }

    const { method = 'GET', data, headers = {} } = options
    
    // 自动添加鉴权头，除了 health 接口
    const finalHeaders = endpoint === '/health' 
      ? headers 
      : { ...buildAuthHeaders(), ...headers }

    try {
      // 构建统一的请求参数
      const requestData: ApiRequest = {
        baseUrl: buildBaseUrl(),
        endpoint,
        method,
        data,
        headers: finalHeaders
      }

      if (currentConnection.value.mode === 'proxy' && config.public.enableServerProxy) {
        // 服务器转发模式 - 统一使用 axios 代理接口
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

        if (requestData.method.toUpperCase() !== 'GET' && requestData.data) {
          axiosConfig.data = requestData.data
        }

        const response = await axiosInstance(axiosConfig)
        return response.data
      } else {
        // 客户端直连模式 - 仅在浏览器中使用
        if (typeof window === 'undefined') {
          throw new Error('Direct client mode can only be used in browser')
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
        throw new Error('Connection refused, please check server address and port')
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout, please check network connection')
      }
      
      if (error.response) {
        const message = error.response.data?.message || error.response.statusText || 'Request failed'
        throw new Error(`${message} (${error.response.status})`)
      }
      
      if (error.data?.message) {
        throw new Error(error.data.message)
      }
      
      throw error
    }
  }

  // 健康检查（不需要鉴权）
  const healthCheck = async (): Promise<boolean> => {
    try {
      await apiRequest('/health')
      return true
    } catch (error) {
      return false
    }
  }

  // 连接验证 - 同时检查健康状态和鉴权
  const validateConnection = async (): Promise<ConnectionValidationResult> => {
    try {
      // 1. 先检查健康状态
      const isHealthy = await healthCheck()
      if (!isHealthy) {
        return {
          isHealthy: false,
          isAuthenticated: false,
          error: 'Server connection failed, please check address and port'
        }
      }

      // 2. 检查鉴权是否正常 - 获取数据库列表
      try {
        await listDatabases()
        return {
          isHealthy: true,
          isAuthenticated: true
        }
      } catch (error: any) {
        // 判断是否是鉴权错误
        if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('auth')) {
          return {
            isHealthy: true,
            isAuthenticated: false,
            error: 'Authentication failed, please check if password is correct'
          }
        }
        
        // 其他错误也认为鉴权有问题
        return {
          isHealthy: true,
          isAuthenticated: false,
          error: `Authentication validation failed: ${error.message}`
        }
      }
    } catch (error: any) {
      return {
        isHealthy: false,
        isAuthenticated: false,
        error: error.message || 'Connection validation failed'
      }
    }
  }

  // 获取数据库列表（使用统一鉴权）
  const listDatabases = async (): Promise<ListDatabasesResponse> => {
    return await apiRequest<ListDatabasesResponse>('/databases')
  }

  // 创建数据库（使用统一鉴权）
  const createDatabase = async (name: string): Promise<CreateDatabaseResponse> => {
    const request: CreateDatabaseRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      name
    }
    return await apiRequest<CreateDatabaseResponse>('/databases', {
      method: 'POST',
      data: request
    })
  }

  // 删除数据库（使用统一鉴权）
  const dropDatabase = async (name: string): Promise<DropDatabaseResponse> => {
    const request: DropDatabaseRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      name: name
    }
    return await apiRequest<DropDatabaseResponse>(`/databases/${name}`, {
      method: 'DELETE',
      data: request
    })
  }

  // 获取集合列表（使用统一鉴权）
  const listCollections = async (dbName: string): Promise<ListCollectionsResponse> => {
    return await apiRequest<ListCollectionsResponse>(`/databases/${dbName}/collections`)
  }

  // 创建集合（使用统一鉴权）
  const createCollection = async (
    dbName: string,
    collectionName: string,
    metricType: DistanceMetric,
    hnswConfig?: HnswConfig
  ): Promise<CreateCollectionResponse> => {
    const request: CreateCollectionRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      db_name: dbName,
      collection_name: collectionName,
      metric_type: metricType,
      hnsw_config: hnswConfig
    }
    return await apiRequest<CreateCollectionResponse>(`/databases/${dbName}/collections`, {
      method: 'POST',
      data: request
    })
  }

  // 删除集合（使用统一鉴权）
  const dropCollection = async (
    dbName: string,
    collectionName: string
  ): Promise<DropCollectionResponse> => {
    const request: DropCollectionRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      db_name: dbName,
      collection_name: collectionName
    }
    return await apiRequest<DropCollectionResponse>(`/databases/${dbName}/collections/${collectionName}`, {
      method: 'DELETE',
      data: request
    })
  }

  // 获取嵌入模型列表（使用统一鉴权）
  const listEmbeddingModels = async (): Promise<ListEmbeddingModelsResponse> => {
    return await apiRequest<ListEmbeddingModelsResponse>('/embed/models')
  }

  // 嵌入并插入向量（使用统一鉴权）
  const embedAndInsert = async (
    dbName: string, 
    collectionName: string, 
    texts: { text: string; metadata: Record<string, any> }[], 
    embeddingModel?: string
  ): Promise<EmbedAndInsertResponse> => {
    const request: EmbedAndInsertRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
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

  // 嵌入并搜索向量（使用统一鉴权）
  const embedAndSearch = async (
    dbName: string,
    collectionName: string,
    queryText: string,
    topK: number,
    embeddingModel?: string,
    filter?: string
  ): Promise<SearchResponse> => {
    const request: EmbedAndSearchRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
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

  // 直接插入向量数组（使用统一鉴权）
  const insertVectors = async (
    dbName: string,
    collectionName: string,
    vectors: { elements: number[]; metadata: Record<string, any> }[]
  ): Promise<InsertVectorsResponse> => {
    const request: InsertVectorsRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      db_name: dbName,
      collection_name: collectionName,
      vectors: vectors.map(v => ({ elements: v.elements, metadata: v.metadata }))
    }
    return await apiRequest<InsertVectorsResponse>(`/databases/${dbName}/collections/${collectionName}/vectors`, {
      method: 'POST',
      data: request
    })
  }

  // 直接向量搜索（使用统一鉴权）
  const searchVectors = async (
    dbName: string,
    collectionName: string,
    queryVector: number[],
    topK: number,
    filter?: string
  ): Promise<SearchResponse> => {
    const request: SearchRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
      db_name: dbName,
      collection_name: collectionName,
      query_vector: queryVector,
      top_k: topK,
      filter: filter || ''
    }
    return await apiRequest<SearchResponse>(`/databases/${dbName}/collections/${collectionName}/search`, {
      method: 'POST',
      data: request
    })
  }

  // 删除向量（使用统一鉴权）
  const deleteVectors = async (
    dbName: string,
    collectionName: string,
    ids: number[]
  ): Promise<DeleteVectorsResponse> => {
    const request: DeleteVectorsRequest = {
      auth: {
        password: currentConnection.value?.password || ''
      },
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
    validateConnection,
    listDatabases,
    createDatabase,
    dropDatabase,
    listCollections,
    createCollection,
    dropCollection,
    listEmbeddingModels,
    embedAndInsert,
    embedAndSearch,
    insertVectors,
    searchVectors,
    deleteVectors
  }
} 
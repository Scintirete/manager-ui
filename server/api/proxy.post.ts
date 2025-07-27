export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // 从请求体中解构必要的参数
    const { endpoint, method = 'GET', data, headers = {} } = body
    
    if (!endpoint) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing endpoint parameter'
      })
    }

    // 构建完整的URL（假设目标服务器信息在请求中提供）
    const { baseUrl } = body
    if (!baseUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing baseUrl parameter'
      })
    }

    const targetUrl = `${baseUrl}${endpoint}`
    
    // 转发请求到目标服务器
    const response = await $fetch(targetUrl, {
      method,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })

    return response
  } catch (error: any) {
    console.error('Proxy request failed:', error)
    
    // 处理网络错误
    if (error.cause?.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service unavailable - connection refused'
      })
    }
    
    // 处理HTTP错误
    if (error.response) {
      throw createError({
        statusCode: error.response.status || 500,
        statusMessage: error.response.statusText || 'Proxy request failed'
      })
    }
    
    // 其他错误
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal proxy error'
    })
  }
}) 
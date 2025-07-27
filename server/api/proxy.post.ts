import { URL } from 'url'
import https from 'https'
import http from 'http'

// 统一的API请求参数接口
interface ApiRequest {
  baseUrl: string
  endpoint: string
  method: 'GET' | 'POST' | 'DELETE'
  data?: any
  headers?: Record<string, string>
}

// 使用Node.js原生模块发送HTTP请求
function makeRequest(url: string, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const client = isHttps ? https : http
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      timeout: 30000
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : {}
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result)
          } else {
            reject({
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              data: result
            })
          }
        } catch (parseError) {
          reject({
            statusCode: res.statusCode,
            statusMessage: '响应解析失败',
            data: data
          })
        }
      })
    })
    
    req.on('error', (error: any) => {
      reject({
        code: error.code,
        message: error.message
      })
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject({
        code: 'ECONNABORTED',
        message: '请求超时'
      })
    })
    
    // 发送请求体（如果有）
    if (options.data) {
      req.write(JSON.stringify(options.data))
    }
    
    req.end()
  })
}

export default defineEventHandler(async (event) => {
  try {
    const request: ApiRequest = await readBody(event)
    const config = useRuntimeConfig()

    if (!config.public.enableServerProxy) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Server proxy is disabled'
      })
    }
    
    // 验证必要参数
    if (!request.endpoint) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing endpoint parameter'
      })
    }

    if (!request.baseUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing baseUrl parameter'
      })
    }

    const targetUrl = `${request.baseUrl}${request.endpoint}`
    
    const requestOptions = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      data: request.method.toUpperCase() !== 'GET' ? request.data : undefined
    }
    
    const response = await makeRequest(targetUrl, requestOptions)
    return response
  } catch (error: any) {
    console.error('Proxy request failed:', error)
    
    // 统一错误处理
    if (error.code === 'ECONNREFUSED') {
      throw createError({
        statusCode: 503,
        statusMessage: '连接被拒绝，请检查服务器地址和端口'
      })
    }
    
    if (error.code === 'ECONNABORTED') {
      throw createError({
        statusCode: 408,
        statusMessage: '请求超时，请检查网络连接'
      })
    }
    
    // 处理HTTP错误
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.data?.message || error.statusMessage || '请求失败',
        data: error.data
      })
    }
    
    // 其他错误
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '内部服务器错误'
    })
  }
}) 
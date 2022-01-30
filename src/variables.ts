const isMicro = process.env.DETA_RUNTIME === 'True' || process.env.DETA_RUNTIME === 'true'
const isSpace = process.env.DETA_SPACE_APP === 'True' || process.env.DETA_SPACE_APP === 'true'
const logLevel = process.env.DETA_LOG_LEVEL || 'debug'
const isDev = process.env.NODE_ENV === 'production' || !isMicro
const isOffline = process.env.DETA_OFFLINE === 'True' || process.env.DETA_OFFLINE === 'true'
const projectKey = process.env.DETA_PROJECT_KEY
const subdomain = process.env.DETA_PATH
const domain = isMicro ? `${ subdomain }.${ isSpace ? 'deta.app' : 'deta.dev' }` : `localhost:${ process.env.PORT || 3000 }`
const region = process.env.AWS_REGION
const memory = process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE !== undefined ? parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) : undefined

export default {
	isMicro,
	isSpace,
	logLevel,
	isDev,
	isOffline,
	projectKey,
	subdomain,
	domain,
	region,
	memory
}
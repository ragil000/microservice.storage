module.exports = (request, response, next) => {
    const apiKey = request.headers['x-api-key']
    console.log('api key', apiKey)
    if(apiKey !== process.env.API_KEY) {
        return response.status(403).json({
            status: false,
            message: 'access denied, invalid API KEY.'
        })
    }
    next()
}
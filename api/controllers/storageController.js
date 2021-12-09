const Model = require('../models/storageModel')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')

const dateObject = new Date()
const subFolder = `${dateObject.getFullYear()}${dateObject.getMonth()}${dateObject.getDate()}`

const storageImage = multer.diskStorage({
    destination: function (request, response, callback) {
        try {
            if(!fs.existsSync(`./uploads/images/original/${subFolder}/`)){
                fs.mkdirSync(`./uploads/images/original/${subFolder}/`)
            }
            callback(null, `./uploads/images/original/${subFolder}/`)
        }catch(error) {
            callback(null, `./uploads/images/`)
        }
    },
    filename: function(request, response, callback) {
        const mimetype = response.mimetype.split('/')
        const filetype = mimetype[1]
        callback(null, `${new Date().getTime()}.${filetype}`)
    }
})

const imageFilter = (request, response, callback) => {
    if(response.mimetype === 'image/jpeg' || response.mimetype === 'image/png') {
        callback(null, true)
    }else {
        callback(new Error('Invalid file type. Only allowed image with type jpg and png.'), false)
    }
}

const uploadImage = multer({
    storage: storageImage,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MiB
    },
    fileFilter: imageFilter
})

const singleResize = async (request) => {
    if(request.file) {
        try {
            multiSize = await sharp(`./${request.file.path}`).toBuffer()
            if(!fs.existsSync(`./uploads/images/small/${subFolder}/`)){
                fs.mkdirSync(`./uploads/images/small/${subFolder}/`)
            }
            const resize = await sharp(multiSize).resize(250).toFile(`./uploads/images/small/${subFolder}/${request.file.filename}`)
            const imageData = {
                fieldname: request.file.fieldname,
                originalname: request.file.originalname,
                encoding: request.file.encoding,
                mimetype: request.file.mimetype,
                original: {
                    destination: request.file.destination,
                    filename: request.file.filename,
                    path: request.file.path,
                    size: request.file.size,
                    url: `${process.env.BASE_URL}/${request.file.path}`
                },
                small: {
                    destination: `./uploads/images/small/${subFolder}/`,
                    filename: request.file.filename,
                    path: `./uploads/images/small/${subFolder}/${request.file.filename}`,
                    size: resize.size,
                    url: `${process.env.BASE_URL}/uploads/images/small/${subFolder}/${request.file.filename}`
                }
            }
            return {
                responseCode: 200,
                status: true,
                message: 'image uploaded successfully.',
                data: imageData
            }
        }catch(error) {
            if(fs.existsSync(request.file.path)) fs.unlinkSync(request.file.path)
            return {
                responseCode: 500,
                status: false,
                message: error.message
            }
        }
    }
}

const uploadSingleImage = uploadImage.single('image')

const fileType = (mimetype) => {
    if(mimetype === 'image/jpeg' || mimetype === 'image/png') {
        return 'image'
    }else {
        return 'file'
    }
}

exports.image_get = async (request, response, next) => {
    const _id = request.query._id

    try{
        if(_id) {
            const getData = await Model.find({ $and: [{_id: _id}, {softDelete: null, status: 'active'}] })
            if(getData) {
                return response.status(200).json({
                    status: true,
                    message: 'data has been displayed.',
                    data: getData.docs.map((result) => {
                        return {
                            _id: result._id,
                            fieldname: result.fieldname,
                            originalname: result.originalname,
                            encoding: result.encoding,
                            mimetype: result.mimetype,
                            original: {
                                destination: result.original.destination,
                                filename: result.original.filename,
                                path: result.original.path,
                                size: result.original.size,
                                url: `${process.env.BASE_URL}/${result.original.path}`
                            },
                            small: {
                                destination: result.small.destination,
                                filename: result.small.filename,
                                path: result.small.path,
                                size: result.small.size,
                                url: `${process.env.BASE_URL}/${result.small.path}`
                            }
                        }
                    })
                })
            }else {
                return response.status(200).json({
                    status: false,
                    message: 'data displayed is empty.'
                })
            }
        }else {
            return response.status(400).json({
                status: false,
                message: '_id parameter not found.'
            })
        }
    }catch(error) {
        return response.status(500).json({
            status: false,
            message: error.message
        })
    }
}

exports.image_post = async (request, response, next) => {
    try {
        uploadSingleImage(request, response, async (error) => {
            if(error) {
                return response.status(500).json({
                    responseCode: 500,
                    status: false,
                    message: error.message
                })
            }else {
                if(request.file) {
                    try{
                        const resize = await singleResize(request)
                        const saveData = await Model.create({
                            type: 'image',
                            data: resize.data
                        })
                        resize.data._id = saveData._id
                        if(resize.status) {
                            return response.status(resize.responseCode).json({
                                responseCode: resize.responseCode,
                                status: resize.status,
                                message: resize.message,
                                data: resize.data
                            })
                        }else {
                            return response.status(resize.responseCode).json({
                                responseCode: resize.responseCode,
                                status: resize.status,
                                message: resize.message
                            })
                        }
                    }catch(error) {
                        return response.status(500).json({
                            responseCode: 500,
                            status: false,
                            message: error.message
                        })
                    }
                }else {
                    return response.status(400).json({
                        responseCode: 400,
                        status: false,
                        message: 'badrequest'
                    })
                }
            }
        })
    }catch(error) {
        if(error.response.data.message) {
            return {
                responseCode: error.response.data.responseCode,
                status: error.response.data.status,
                message: error.response.data.message
            }
        }else {
            return {
                responseCode: 500,
                status: false,
                message: error.message
            }
        }
    }
}

exports.image_delete = async (request, response, next) => {
    const _id = request.params._id

    try{
        if(_id) {
            const getData = await Model.find({ $and: [{_id: _id}, {softDelete: null, status: 'active'}] })
            if(getData) {
                const deleteData = await Model.updateOne({ _id: _id }, { $set: { status: 'change' } })
                return response.status(200).json({
                    status: true,
                    message: 'data deleted successfully.'
                })
            }else {
                return response.status(200).json({
                    status: false,
                    message: 'data displayed is empty.'
                })
            }
        }else {
            return response.status(400).json({
                status: false,
                message: '_id parameter not found.'
            })
        }
    }catch(error) {
        return response.status(500).json({
            status: false,
            message: error.message
        })
    }
}
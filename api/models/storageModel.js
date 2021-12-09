const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const schema = mongoose.Schema({
    type: {
        type: String
    },
    data: {
        type: {
            fieldname: {
                type: String
            },
            originalname: {
                type: String
            },
            encoding: {
                type: String
            },
            mimetype: {
                type: String
            },
            destination: {
                type: String
            },
            filename: {
                type: String
            },
            path: {
                type: String
            },
            size: {
                type: Number
            },
            original: {
                type: {
                    destination: {
                        type: String
                    },
                    filename: {
                        type: String
                    },
                    path: {
                        type: String
                    },
                    size: {
                        type: Number
                    }
                }
            },
            small: {
                type: {
                    destination: {
                        type: String
                    },
                    filename: {
                        type: String
                    },
                    path: {
                        type: String
                    },
                    size: {
                        type: Number
                    }
                }
            }
        }
    },
    status: {
        type: String,
        enum: ['active', 'change', 'deleted'],
        default: 'active'
    },
    softDelete: {
        type: Date,
        default: null
    }
},
{
    timestamps: true
})

schema.plugin(mongoosePaginate)

const modelSchema = mongoose.model('Storage', schema)
modelSchema.paginate().then({})
module.exports = modelSchema
import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({

  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],


  form: {
    /**
     * Normalize empty string values to null.
     */
    convertEmptyStringsToNull: true,

    /**
     * Content types handled by the form parser.
     */
    types: ['application/x-www-form-urlencoded'],
  },


  json: {

    convertEmptyStringsToNull: true,

    /**
     * Content types handled by the JSON parser.
     */
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },


  multipart: {
    /**
     * Automatically process uploaded files into the system tmp directory.
     */
    autoProcess: true,


    convertEmptyStringsToNull: true,

    /**
     * Routes where multipart processing is handled manually.
     */
    processManually: [],

    /**
     * Maximum accepted payload size for multipart requests.
     */
    limit: '20mb',

    /**
     * Content types handled by the multipart parser.
     */
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig

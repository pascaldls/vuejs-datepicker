module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "overrides": [
    ],
    parserOptions: {
      sourceType: 'module'
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/vue3-essential"
    ],
    "plugins": [
        "vue"
    ],
    "rules": {
      // allow paren-less arrow functions
      'arrow-parens': 0,
      // allow async-await
      'generator-star-spacing': 0,
      // allow debugger during development
      'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0, 
      "no-unused-vars": "off",
      "vue/no-deprecated-slot-attribute" : "off" ,
      "vue/multi-word-component-names" : "off"
    }, 

}

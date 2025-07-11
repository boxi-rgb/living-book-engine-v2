module.exports = {
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // STRICT RULES - NO EXCEPTIONS
    'no-console': 'error',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'strict': ['error', 'never'],
    
    // CODE STYLE - MANDATORY
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    
    // QUALITY GATES
    'max-len': ['error', { code: 100 }],
    'complexity': ['error', 10],
    'max-depth': ['error', 4]
  }
}
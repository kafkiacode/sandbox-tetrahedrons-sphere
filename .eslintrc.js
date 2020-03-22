module.exports = {
  parser: 'babel-eslint',
  plugins: ['prettier', 'react-hooks'],
  extends: ["react-app", 'airbnb', 'prettier', 'prettier/react'],
  env: {
    browser: true,
    jest: true,
  },
  rules: {
    'react/jsx-filename-extension': [
      'warn',
      {
        extensions: ['.js', '.jsx'],
      },
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        arrowParens: 'always',
      },
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react/prop-types': 'off',
    'no-await-in-loop': 'off',
    'no-constant-condition': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'react/no-array-index-key': 'off',
  }
}
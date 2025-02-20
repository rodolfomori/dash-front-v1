// src/utils/currencyUtils.js

/**
 * Formata um valor numérico para moeda brasileira
 * @param {number} value - Valor numérico a ser formatado
 * @returns {string} Valor formatado em Real brasileiro
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata input de entrada para moeda brasileira
 * @param {string} value - Valor de entrada
 * @returns {string} Valor formatado em Real brasileiro
 */
export const formatCurrencyInput = (value) => {
  // Remove qualquer caractere que não seja número
  const numericValue = value.replace(/\D/g, '');
  
  // Converte para número
  const numberValue = parseInt(numericValue) || 0;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue / 100);
};

/**
 * Converte valor formatado de volta para número
 * @param {string} formattedValue - Valor formatado em moeda brasileira
 * @returns {number} Valor numérico
 */
export const parseCurrencyInput = (formattedValue) => {
  // Remove caracteres não numéricos
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  
  // Converte para número
  return parseInt(numericValue) / 100 || 0;
};
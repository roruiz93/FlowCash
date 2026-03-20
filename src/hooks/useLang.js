import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS } from '../constants';

const LangContext = createContext({ lang: 'es', setLang: () => {}, t: (key) => key });

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('es');
  const t = (key) => TRANSLATIONS[lang][key] ?? key;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);

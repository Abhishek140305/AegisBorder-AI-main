import { describe, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import HomeDashboard from '../../components/HomeDashboard.jsx';

describe('HomeDashboard render', () => {
  it('renders', () => {
    try {
      renderToString(React.createElement(HomeDashboard, { onTabChange: () => {}, onOpenScamExample: () => {}, currentLang: 'hi' }));
      console.log('HOMEDASH OK');
    } catch (e) {
      console.log('HOMEDASH CRASH:', e.message);
      throw e;
    }
  });
});
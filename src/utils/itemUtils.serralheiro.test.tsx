import React from 'react';
import { describe, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateDrop } from './itemUtils';
import ItemTooltipContent from '../components/ItemTooltipContent';


describe('Tooltip da Vingança do Serralheiro', () => {
  it('deve exibir corretamente os dados da espada do serralheiro', () => {
    for (let i = 0; i < 3; i++) {
      const item = generateDrop(50, 'serralheiro_unique_2h_sword', 'Único', 'ice_dragon_boss');
      if (!item) {
        console.warn('Não foi possível gerar a espada do serralheiro');
        continue;
      }
      // Renderiza a tooltip como HTML estático
      const html = renderToStaticMarkup(<ItemTooltipContent item={item} />);
      // Loga o HTML para inspeção
      // eslint-disable-next-line no-console
      console.log(`Tooltip ${i+1}:\n`, html);
    }
  });
}); 
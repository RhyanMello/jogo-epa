# EPA! RK Hunt

Jogo estilo Duck Hunt feito em HTML, JavaScript e Canvas puro, com visual pixel-art retrô e a logo da RK Informática e Games.

## Como jogar

```bash
npm run dev
```

Depois abra http://localhost:8080. Não precisa instalar nada além do Node. Também dá para abrir o `index.html` direto no navegador.

- Antes de começar, cada jogador digita o nome (até 10 letras).
- São 5 fases em sequência, uma por nível: Fácil, Normal, Médio, Difícil e Impossível. Cada fase tem 5 pássaros.
- Mire com o mouse e clique para atirar. Cada pássaro dá 3 tiros; errou os 3 ou demorou, ele foge.
- Acerte a meta da fase (barra azul no placar) para passar. Se não acertar, o jogo acaba.
- Pássaro preto vale 500, azul 1000 e vermelho 1500, multiplicado pelo número da fase. Acertar os 5 da fase dá bônus, e vencer as 5 fases dá mais 10000.
- A classificação guarda os 10 melhores neste navegador. O botão Limpar (dois cliques) zera a tabela.
- `Esc` ou `P` pausa (ou o botão no canto da tela). `M` liga e desliga o som.

## Arquivos

- `index.html`: página do jogo
- `game.js`: todo o jogo (sprites, sons, lógica)
- `server.js`: servidor local sem dependências
- `assets/logo-rk.png`: logo da RK

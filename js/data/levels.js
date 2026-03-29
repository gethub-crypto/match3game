const Levels = {
  data: [],

  async load() {
    const res = await fetch('levels.csv');
    const text = await res.text();

    const rows = text.trim().split('\n').slice(1);

    this.data = rows.map(row => {
      const [id, moves, type, target, colors, reward, difficulty] = row.split(',');

      return {
        id: +id,
        moves: +moves,
        type,
        target: +target,
        colors: colors || null,
        reward: +reward,
        difficulty
      };
    });

    console.log("Levels loaded:", this.data);
  },

  get(levelId) {
    return this.data.find(l => l.id === levelId);
  }
};

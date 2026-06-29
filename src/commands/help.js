const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Veja todos os comandos disponíveis'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const helpEmbed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('📖 Guia de Comandos - Discord Quest Bot')
      .setDescription('Aqui estão todos os comandos disponíveis')
      .addFields(
        {
          name: '🔐 Autenticação',
          value: '`/login <token>` - Autentique com seu token do Discord\n`/logout` - Faça logout e remova seu token',
          inline: false
        },
        {
          name: '📋 Gerenciamento de Quests',
          value: '`/aceitar <id>` - Aceite uma quest pelo ID\n`/fila` - Veja todas as suas quests',
          inline: false
        },
        {
          name: '💡 Dicas Importantes',
          value: '• Seu token é armazenado com segurança no servidor\n• Sempre use `/logout` antes de deixar o servidor\n• Mantenha seu token em segredo!\n• O bot executa ações em tempo real',
          inline: false
        },
        {
          name: '⚙️ Informações do Bot',
          value: 'Versão: 1.0.0\nDesenvolvedor: Discord Quest Team\nStatus: ✅ Online',
          inline: false
        }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: 'Discord Quest Bot - Use os comandos acima para começar' })
      .setTimestamp();

    await interaction.editReply({ embeds: [helpEmbed] });
  },
};

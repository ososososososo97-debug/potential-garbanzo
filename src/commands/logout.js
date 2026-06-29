const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserDB, HistoryDB } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logout')
    .setDescription('Faça logout e remova seu token'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;

    try {
      const user = await UserDB.get(discordId);
      
      if (!user) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Não Autenticado')
          .setDescription('Você não está autenticado neste momento.')
          .setFooter({ text: 'Use /login para se autenticar' });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Removr usuário
      await UserDB.delete(discordId);
      await HistoryDB.log(user.id, 'logout', null, 'success');

      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Logout Bem-Sucedido')
        .setDescription('Seu token foi removido com segurança.')
        .addFields(
          { name: '🔐 Status', value: 'Desautenticado', inline: true },
          { name: '⏰ Hora', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setFooter({ text: 'Use /login para se autenticar novamente' })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });
    } catch (error) {
      console.error('Erro no logout:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro ao Fazer Logout')
        .setDescription('Ocorreu um erro ao processar seu logout.')
        .addFields(
          { name: '⚠️ Detalhes', value: error.message, inline: false }
        )
        .setFooter({ text: 'Discord Quest Bot' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

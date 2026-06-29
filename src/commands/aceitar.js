const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserDB, QuestDB, HistoryDB } = require('../utils/database');
const QuestAPI = require('../utils/questAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aceitar')
    .setDescription('Aceite uma quest do Discord')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID da quest a ser aceita')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const questId = interaction.options.getString('id');
    const discordId = interaction.user.id;

    try {
      // Obter dados do usuário
      const user = await UserDB.get(discordId);
      if (!user) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Não Autenticado')
          .setDescription('Você precisa usar `/login` primeiro para se autenticar.')
          .setFooter({ text: 'Use /login com seu token' });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Criar instância da API
      const questAPI = new QuestAPI(user.token);

      // Tentar aceitar a quest
      const result = await questAPI.acceptQuest(questId);

      if (result.success) {
        // Salvar no banco de dados
        await QuestDB.add(user.id, questId, result.data.name || 'Quest Desconhecida');
        await HistoryDB.log(user.id, 'accept_quest', questId, 'success');

        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Quest Aceita!')
          .setDescription(`Quest **${result.data.name || questId}** foi aceita com sucesso.`)
          .addFields(
            { name: '🎯 ID da Quest', value: `\`${questId}\``, inline: true },
            { name: '📊 Status', value: 'Pendente', inline: true },
            { name: '⏰ Aceita em', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
          )
          .setFooter({ text: 'Acompanhe com /fila' })
          .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
      } else {
        await HistoryDB.log(user.id, 'accept_quest', questId, 'failed');

        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro ao Aceitar Quest')
          .setDescription(result.error || 'Falha desconhecida ao aceitar a quest.')
          .addFields(
            { name: '🎯 ID da Quest', value: `\`${questId}\``, inline: false }
          )
          .setFooter({ text: 'Verifique o ID e tente novamente' });

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      console.error('Erro ao aceitar quest:', error);
      
      await HistoryDB.log(discordId, 'accept_quest', questId, 'error');

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro Interno')
        .setDescription('Ocorreu um erro ao processar sua solicitação.')
        .addFields(
          { name: '⚠️ Detalhes', value: error.message, inline: false }
        )
        .setFooter({ text: 'Discord Quest Bot' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

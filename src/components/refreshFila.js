const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserDB, QuestDB, HistoryDB } = require('../utils/database');
const QuestAPI = require('../utils/questAPI');

module.exports = {
  data: {
    name: 'refresh_fila'
  },
  type: 'button',

  async execute(interaction) {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;

    try {
      const user = await UserDB.get(discordId);
      if (!user) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Não Autenticado')
          .setDescription('Sua sessão expirou. Use `/login` para se autenticar novamente.');

        return await interaction.editReply({ embeds: [errorEmbed], components: [] });
      }

      const quests = await QuestDB.getByUser(user.id);
      const stats = {
        total: quests.length,
        pending: quests.filter(q => q.status === 'pending').length,
        completed: quests.filter(q => q.status === 'completed').length,
        in_progress: quests.filter(q => q.status === 'in_progress').length
      };

      const mainEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Painel de Quests - Discord')
        .setDescription(`**${stats.total}** quests na sua fila`)
        .addFields(
          { 
            name: '📊 Estatísticas', 
            value: `⏳ Pendentes: **${stats.pending}**\n🔄 Em Progresso: **${stats.in_progress}**\n✅ Completas: **${stats.completed}**`, 
            inline: false 
          },
          { 
            name: '🌍 Sistema Multi-País', 
            value: 'Este bot funciona com quests de qualquer país/região do Discord!', 
            inline: false 
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}` })
        .setTimestamp();

      // Lista de quests (máximo 5 na exibição principal)
      if (quests.length > 0) {
        const questList = quests.slice(0, 5).map(q => {
          const statusEmoji = {
            'pending': '⏳',
            'completed': '✅',
            'in_progress': '🔄',
            'failed': '❌'
          }[q.status] || '❓';
          return `${statusEmoji} **${q.questName}** (\`${q.questId}\`)`;
        }).join('\n');

        mainEmbed.addFields(
          { 
            name: '📝 Quests Recentes', 
            value: questList || 'Nenhuma quest', 
            inline: false 
          }
        );

        if (quests.length > 5) {
          mainEmbed.addFields(
            { 
              name: '📌 Mais Quests', 
              value: `Você tem ${quests.length - 5} quest(s) adicional(is)`, 
              inline: false 
            }
          );
        }
      }

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_fila')
          .setLabel('🔄 Atualizar')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('quest_nova')
          .setLabel('➕ Nova Quest')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('quest_detalhes')
          .setLabel('📖 Detalhes')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ 
        embeds: [mainEmbed],
        components: [actionRow]
      });
    } catch (error) {
      console.error('Erro ao atualizar fila:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro ao Atualizar')
        .setDescription('Ocorreu um erro ao atualizar suas quests.');

      await interaction.editReply({ embeds: [errorEmbed], components: [] });
    }
  },
};

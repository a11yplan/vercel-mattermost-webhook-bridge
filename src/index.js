export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    
    if (url.pathname !== '/webhook') {
      return new Response('Not found', { status: 404 });
    }

    try {
      const vercelPayload = await request.json();
      
      const mattermostWebhookUrl = env.MATTERMOST_WEBHOOK_URL;
      if (!mattermostWebhookUrl) {
        console.error('MATTERMOST_WEBHOOK_URL not configured');
        return new Response('Server configuration error', { status: 500 });
      }

      const mattermostPayload = formatVercelToMattermost(vercelPayload);
      
      const response = await fetch(mattermostWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mattermostPayload),
      });

      if (!response.ok) {
        console.error('Failed to send to Mattermost:', response.status, await response.text());
        return new Response('Failed to send notification', { status: 500 });
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Invalid request', { status: 400 });
    }
  },
};

function formatVercelToMattermost(vercelPayload) {
  const { type, payload, createdAt } = vercelPayload;
  
  let title = '';
  let text = '';
  let color = '#0070f3';
  
  switch (type) {
    case 'deployment':
      title = `🚀 Deployment ${payload.deployment.meta.githubCommitMessage || 'Update'}`;
      text = formatDeployment(payload);
      color = payload.deployment.ready ? '#0f9549' : '#f5a623';
      break;
      
    case 'deployment-ready':
      title = '✅ Deployment Ready';
      text = formatDeploymentReady(payload);
      color = '#0f9549';
      break;
      
    case 'deployment-error':
      title = '❌ Deployment Failed';
      text = formatDeploymentError(payload);
      color = '#e00';
      break;
      
    case 'deployment-canceled':
      title = '🚫 Deployment Canceled';
      text = formatDeploymentCanceled(payload);
      color = '#666';
      break;
      
    default:
      title = `📢 ${type}`;
      text = JSON.stringify(payload, null, 2);
  }
  
  const timestamp = new Date(createdAt).toISOString();
  
  return {
    username: 'Vercel',
    icon_url: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
    attachments: [{
      fallback: title,
      color: color,
      title: title,
      text: text,
      footer: `Vercel | ${timestamp}`,
      footer_icon: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png',
    }],
  };
}

function formatDeployment(payload) {
  const { deployment, project, team } = payload;
  const domain = deployment.url || deployment.alias?.[0] || 'No domain';
  
  let text = `**Project:** ${project.name}\n`;
  text += `**Environment:** ${deployment.target || 'production'}\n`;
  text += `**URL:** https://${domain}\n`;
  
  if (deployment.meta.githubCommitRef) {
    text += `**Branch:** ${deployment.meta.githubCommitRef}\n`;
  }
  
  if (deployment.meta.githubCommitAuthorLogin) {
    text += `**Author:** ${deployment.meta.githubCommitAuthorLogin}\n`;
  }
  
  if (deployment.meta.githubCommitSha) {
    text += `**Commit:** \`${deployment.meta.githubCommitSha.substring(0, 7)}\`\n`;
  }
  
  if (team) {
    text += `**Team:** ${team.name}\n`;
  }
  
  return text;
}

function formatDeploymentReady(payload) {
  const { deployment, project } = payload;
  const domain = deployment.url || deployment.alias?.[0] || 'No domain';
  
  let text = `✅ **${project.name}** is now live!\n\n`;
  text += `🌐 **URL:** https://${domain}\n`;
  text += `📦 **Environment:** ${deployment.target || 'production'}\n`;
  
  if (deployment.meta.githubCommitMessage) {
    text += `\n💬 **Commit:** ${deployment.meta.githubCommitMessage}`;
  }
  
  return text;
}

function formatDeploymentError(payload) {
  const { deployment, project } = payload;
  
  let text = `❌ Failed to deploy **${project.name}**\n\n`;
  text += `📦 **Environment:** ${deployment.target || 'production'}\n`;
  
  if (deployment.meta.githubCommitRef) {
    text += `🌿 **Branch:** ${deployment.meta.githubCommitRef}\n`;
  }
  
  if (deployment.errorMessage) {
    text += `\n⚠️ **Error:** ${deployment.errorMessage}`;
  }
  
  return text;
}

function formatDeploymentCanceled(payload) {
  const { deployment, project } = payload;
  
  let text = `🚫 Deployment canceled for **${project.name}**\n\n`;
  text += `📦 **Environment:** ${deployment.target || 'production'}\n`;
  
  if (deployment.meta.githubCommitRef) {
    text += `🌿 **Branch:** ${deployment.meta.githubCommitRef}\n`;
  }
  
  return text;
}
const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
require('dotenv').config({ path : 'variables.env'});
const assistant = new AssistantV2({
  version: '2020-04-01',
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_KEY,
  }),
  url: 'https://api.us-south.assistant.watson.cloud.ibm.com',
});


function crearSession() {
  return assistant.createSession({
    assistantId: process.env.WATSON_ASSITANT_ID
  })
}

function deleteSession(id_session) {
  return assistant.deleteSession({
    assistantId: process.env.WATSON_ASSITANT_ID,
    sessionId: id_session
  })
}


function sendMessage(input, id_session){
  return assistant.message({
    assistantId: process.env.WATSON_ASSITANT_ID,
    sessionId: id_session,
    input: {
      'message_type': 'text',
      'text': input
      }
  })
}

module.exports = {
  crearSession,
  deleteSession,
  sendMessage
}
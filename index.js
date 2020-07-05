const express = require('express');
const {FB,Text,Image,Typing,QuickReplies,QuickRepliesOption} = require('adathink-sdk-bot');
const {
  insertClient,insertPedidos,ultimaModification,existeSession,sessionUsuario,guardarSession,
  actualizarSession
  } = require('./models/connection');
const {crearSession, sendMessage} = require('./watson');
require('dotenv').config({ path : 'variables.env'});
const app = express();
app.use(express.json());

FB.config({
  TOKEN_FACEBOOK: process.env.FACEBBOK_TOKEN,
  KEY_FACEBOOK:  process.env.FACEBBOK_KEY
})


// enlaze de verificacion facebook y tu servidor
app.get('/',FB.checkWebhook);


let numPeticion = 1;

// enviar respuesta atravez de messenger
app.post('/', async function(req,res) {
  // enviar estado de ok a FB
  res.sendStatus(200);
  // Intanciamos la clase FB pasando como parametro el request que nos envia facebook
  let FBTools = new FB(req.body);
  console.log("llego un mensaje ", req.body);

  // obtener la informacion de usuario de fb
  let user = await FBTools.getInfoUser();
  console.log(user);

  // consultamos si existe session en ibm del usuario
  let sessionId = await existeSession(user.id);

  // obtenemos el id de la session iniciada para ibm watson
  let id_session
  if(sessionId){
    id_session = await sessionUsuario(user.id);
  }else{
    let session = await crearSession();
    id_session = session.result.session_id;
    guardarSession(user.id,id_session);
  }
  
  
   
  console.log(id_session);

  // obteniendo el mensaje que envia el usuario
  let msgUser = FBTools.getMessage();
  let msgPayload = FBTools.getPayload();
  
  console.log(msgPayload)
  console.log(msgUser);


  
  // saludar al usuario en la primera interacion
  if(numPeticion === 1){
    let userName = new Text("Bienvenido :"+user.first_name+" "+user.last_name);
    FBTools.addResponse(userName);
  }

  // enviando la peticion del cliente a ibm watson
  let finalPedido = false;
  let result;
  if(msgPayload === null){
    result = await sendMessage(msgUser,id_session); 
    // consultamos si es el final del pedido
    const reg = /[0-9]{9}/;
    let resp = reg.test(msgUser);
    finalPedido = resp;

  }else{
    result = await sendMessage(msgPayload.payload,id_session); 
  }

  
  let data_result = result.result.output;

  // preparamos la respuesta
  let {generic} = data_result;
  console.log(generic);
  if(generic.length === 0){
    let msg = new Texto("No se entendio");
    FBTools.addResponse(msg);
  }else{
    generic.forEach(input => {
      switch (input.response_type) {
        case "text":
          let texto = new Text(input.text);
          FBTools.addResponse(texto);
          break;
        case "image":
          let imagen = new Image(input.source);
          FBTools.addResponse(imagen);
          if(input.title){
            let titulo = new Text(input.title);
            FBTools.addResponse(titulo)
          }
          if(input.description){
            let description = new Text(input.description);
            FBTools.addResponse(description);
          }

          break;
        case "option":
          // console.log(input.title);
          let title = input.title;
          // console.log(title)
          // console.log(input.options);
          let quick = new QuickReplies(title);
          input.options.forEach(option => {
            // console.log(option.label);
            let label = option.label;
            // console.log(option.value);
            let {text} = option.value.input;
            // console.log(text)
            let option_text = new QuickRepliesOption.QuickRepliesOption(QuickRepliesOption.TYPE_TEXT,label,text);
            quick.addOption(option_text);
          })
  
          FBTools.addResponse(quick);
          break;
      
        default:
          console.log("no se identifico el tipo de mensaje");
          return;
          break;
      }
    });
  }

  // envia un escribiendo
  FBTools.sendDirect(new Typing());

  // detiene la respuesta por 2s
  await FBTools.sleep(2000);
  
  // crea una respuesta y la envia al usuario
  let result_msg = await FBTools.sendResponse();
  console.log(result_msg);
  if(finalPedido){
    insertClient(user.first_name,user.last_name);
    let idClient = await ultimaModification();
    console.log(idClient)
    insertPedidos(idClient);
  }
  numPeticion++;

});

const port = process.env.PORT = 4000;
app.listen(port,() => {
  console.log("Servidor corriendo en el puerto "+port);
})
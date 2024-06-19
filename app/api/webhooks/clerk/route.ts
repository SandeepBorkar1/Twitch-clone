// import { Webhook } from "svix";
// import { headers } from "next/headers";
// import { WebhookEvent } from "@clerk/nextjs/server";

// import { db } from "@/lib/db";

// export async function POST(req:Request) {

//     const WEBHOOK_SECRET=process.env.CLERK_WEBHOOK_SECRET

//     if(!WEBHOOK_SECRET){
//         throw new Error('Please add CLERK_WEBHOOK_SECRET from clerk dshboard to .env')
//     }
//     //Get the Headers
//     const headerPayload=headers();
//     const svix_id=headerPayload.get("svix_id");
//     const svix_timestamp=headerPayload.get("svix_timestamp");
//     const svix_signature=headerPayload.get("svix_signature");

//     if(!svix_id || !svix_signature || !svix_timestamp){
//         return new Response('Error occured -- no svix headers',{
//             status:400
//         })

        
//     }

//     //grt the body
//     const payload=await req.json()
//     const body=JSON.stringify(payload);

//     //create a new instance with your webhooksecret
//     const wh=new Webhook(WEBHOOK_SECRET);
 
//     let evt:WebhookEvent

//     try{
//         evt=wh.verify(body,{
//             "svix-id":svix_id,
//             "svix-signature":svix_signature,
//             "svix-timestamp":svix_timestamp,
//         }) as WebhookEvent
//     } catch (err){
//         console.error("Error verifying webhook:",err);
//         return new Response('Error occured',{
//             status:400
//         })
//     }
    
   
//     const eventType=evt.type;

//     if(eventType === "user.created"){
//         await db.user.create({
//             data:{
//                 externalUserId: payload.data.id,
//                 username: payload.data.username,
//                 imageUrl: payload.data.image_url
//             }
//         })
//     }
   

//     return new Response("",{status:200})

// }












import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createUser } from '@/lib/db'
import { User } from '@prisma/client'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    )
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occurred', {
      status: 400
    })
  }

  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    if (!id || !email_addresses) {
      return new Response('Error occurred -- missing data', {
        status: 400
      })
    }

    const user = {
      clerkUserId: id,
      email: email_addresses[0].email_address,
      ...(first_name ? { firstName: first_name } : {}),
      ...(last_name ? { lastName: last_name } : {}),
      ...(image_url ? { imageUrl: image_url } : {})
    }

    await createUser(user as User)
  }

  return new Response('', { status: 200 })
}







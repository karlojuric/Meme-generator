# InstantDB Configuration Checklist

## Schema

```ts
import { i } from '@instantdb/admin';

export default i.schema({
  entities: {
    memes: i.entity({
      title: i.string().optional(),
      description: i.string().optional(),
      imagePath: i.string(),
      imageUrl: i.string().optional(),
      canvasState: i.string(),
      authorId: i.ref('$users'),
      authorEmail: i.string().optional(),
      upvoteCount: i.number().default(0),
      createdAt: i.number(),
    }),
    votes: i.entity({
      memeId: i.ref('memes'),
      userId: i.ref('$users'),
      createdAt: i.number(),
    }),
  },
});
```

## Permissions

```ts
export default {
  memes: {
    allow: {
      create: 'auth.id != null',
      update: 'auth.id == data.authorId',
      delete: 'auth.id == data.authorId',
      view: 'true',
    },
  },
  votes: {
    allow: {
      create: `auth.id != null
        && data.userId == auth.id
        && count(votes, { memeId: data.memeId, userId: auth.id }) == 0`,
      delete: 'auth.id == data.userId',
      view: 'true',
    },
  },
  $files: {
    allow: {
      create: 'auth.id != null',
      view: 'true',
      delete: 'resource.owner == auth.id',
    },
  },
};
```

## Environment variables

```
# client/.env.local
VITE_INSTANT_APP_ID=your_public_app_id

# server/.env
INSTANT_APP_ID=your_public_app_id
INSTANT_ADMIN_TOKEN=your_admin_token
PORT=4000
```

## Email

Configure a custom sender in the InstantDB dashboard under **Auth → Magic Codes**, or keep the default sender for testing. Make sure magic-code emails are verified before inviting real users.


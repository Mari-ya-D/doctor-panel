

import { Context, Scenes } from 'telegraf';

export interface SessionData extends Scenes.SceneSessionData {
  awaitingConsultation?: boolean;
  selectedDoctor?: string;
  consultStep?: string;
}

export interface BotContext extends Context {
  session: SessionData & Scenes.SceneSession<SessionData>;
  scene: Scenes.SceneContextScene<BotContext, SessionData>;
  
}
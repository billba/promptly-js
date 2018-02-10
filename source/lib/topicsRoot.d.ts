import { Topic, TopicState } from './topic';
export interface TopicsRootState<S extends TopicState> {
    state?: S;
}
declare global  {
    interface ConversationState {
        topicsRoot?: TopicsRootState<TopicState>;
    }
}
export declare abstract class TopicsRoot extends Topic<TopicState> {
    constructor(context: BotContext);
}

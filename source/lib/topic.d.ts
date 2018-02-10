import { Promiseable } from 'botbuilder';
export interface ActiveTopicState {
    key: string;
    state?: any;
}
export interface TopicState {
    activeTopic?: ActiveTopicState;
}
export declare abstract class Topic<S extends TopicState, V = any> {
    constructor(state: S);
    private _state;
    state: S;
    abstract onReceive(context: BotContext): Promiseable<any>;
    protected _onSuccess?: (context: BotContext, value: V) => void;
    onSuccess(success: (context: BotContext, value: V) => void): this;
    protected _onFailure?: (context: BotContext, reason: string) => void;
    onFailure(failure: (context: BotContext, reason: string) => void): this;
    private _subTopics;
    protected readonly subTopics: Map<string, (any?) => Topic<any>>;
    private _activeTopic;
    setActiveTopic(subTopicKey: string, ...args: any[]): Topic<any, any>;
    readonly activeTopic: Topic<any>;
    readonly hasActiveTopic: boolean;
    clearActiveTopic(): void;
}

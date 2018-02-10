import { Promiseable } from 'botbuilder';

// ActiveTopicState - Used to persist state required to recreate the active Topic between turns. 
export interface ActiveTopicState {
    // key - Key of function in ConversationTopic.subTopics() map used to create active Topic on last turn.
    key: string;
    // state - State of active Topic used from the last turn. 
    //  Note: State must by any becuase child topic state will vary amoung all the possible 
    //      sub-topics for a given ConversationTopic.
    state?: any;
}

// TopicState - Used to persist state required to recreate the Topic 
//  between turns, including any active sub-topic (Topic or Prompt). 
//  Note: Extend TopicState to store state above and what is required to persist the 
//      active sub-topic between turns.
export interface TopicState {
    activeTopic?: ActiveTopicState;
}

// Topic - Abstract base class for modeling a topic of conversation.
//  S = Interface for the state of the Topic, used to manage the Topic on each turn, 
//      or call to onReceive().
//  V = Interface for the resulting value for when the Topic completes successfully.
//      Optional for cases where the Topic doesn't need to return a value. 
export abstract class Topic<S extends TopicState, V = any> {

    constructor(state: S) {
        this._state = state;
        return this;
    }

    // state - Property to get state of Topic for persisting between turns.
    private _state: S;
    public get state(): S {
        return this._state;
    }
    public set state(state: S) {
        this._state = state;
    }

    // onReceive - Called on each turn when Topic is the active topic of conversation.
    abstract onReceive(context: BotContext): Promiseable<any>;

    // onSuccess - Function to call when the Topic completes successfully, passing the
    //  resulting value of the Topic.
    protected _onSuccess?: (context: BotContext, value: V) => void = () => {};
    public onSuccess(success: (context: BotContext, value: V) => void) {
        this._onSuccess = success;
        return this;
    }

    // onFailure - Function to call when the Topic ends unsuccessfully, passing the reason
    //  why the Topic failed. 
    protected _onFailure?: (context: BotContext, reason: string) => void = () => {};
    public onFailure(failure: (context: BotContext, reason: string) => void) {
        this._onFailure = failure;
        return this;
    }

    // Sub-topic management.
    // subTopics - Map of functions used to create any sub-topics for the conversation topic
    //  between turns.
    private _subTopics = new Map<string, (any?) => Topic<any>>();
    protected get subTopics(): Map<string, (any?) => Topic<any>> {
        return this._subTopics;
    }

    // _activeTopic - The "active" Topic for the ConversationTopic. When one of the sub-topics is the 
    //  active topic, the ConversationTopic's onReceive() should call/defer to the active Topic's 
    //  onReceive() to handle messages from the user until the active Topic completes.
    private _activeTopic: Topic<any>;
    
    // setActiveTopic - Called to set one of the sub-topics managed by this.subTopics() to be 
    //  the active Topic. 
    //  subTopicKey - The key in the this.subTopics() map used to create the active Topic 
    //      on the initial turn (turn 0) and to recreate the active topic on subsequent turns, 
    //      until the active Topic completes.
    //  args - Any arguments used to create the topic on the initial turn (turn 0).
    public setActiveTopic(subTopicKey: string, ...args) {

        // Instantiate/set the active Topic by calling the corresponding function in this.subTopics(),
        //  using args if supplied.
        if(args.length > 0) {
            this._activeTopic = this.subTopics.get(subTopicKey)(...args);;
        } else {
            this._activeTopic = this.subTopics.get(subTopicKey)();;
        }

        // Persist the this.subTopics() key used to create/set the active Topic and the 
        //  sub-topics's state, "dehydrating" the active topic, so it can be 
        //  "rehydrated" on subsequent turns.
        this.state.activeTopic = { key: subTopicKey, state: this._activeTopic.state };

        return this._activeTopic;
    }
    // activeTopic - Used to recreate ("rehydrate") the active topic on the current turn
    //  so it can handle the context/message of the current turn.
    public get activeTopic(): Topic<any> {

        // If there is no active topic persisted in state, there is not active topic.
        if(!this.state.activeTopic) {
            return undefined;
        } 
        
        // If there is an active child topic object reference, return that.
        if(this._activeTopic) {
            return this._activeTopic;
        }

        // Recreate the active topic using the applicable function in this.subTopics() 
        //  and the state persisted on the last turn.
        this._activeTopic = this.subTopics.get(this.state.activeTopic.key)();
        this._activeTopic.state = this.state.activeTopic.state;
        
        return this._activeTopic;
    }

    public get hasActiveTopic(): boolean {
        return this.state.activeTopic !== undefined;
    }

    public clearActiveTopic() {
        this.state.activeTopic = undefined;
    }
}
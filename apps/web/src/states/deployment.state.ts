import {action, makeObservable, observable} from "mobx"

// No usage currently
class DeploymentState {
    public status: string = ""
    constructor() {
        makeObservable(this, {
            status: observable,
            setStatus: action
        })
    }

    setStatus(value: string) {
        this.status = value
    }
}

export const deploymentState = new DeploymentState()
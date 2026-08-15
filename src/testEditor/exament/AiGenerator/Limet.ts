import type { User } from "../../../hooks/Utils";


export let LIMET_RANGE: number

export function Limet(user: (User | null)){
    
    if(user === null) return;

    if(user.dailyAttemptsUsed) {
        return user.dailyAttemptsUsed
    } else{
        if(!user.dailyAttemptsUsed && user.subscription === 'unlimited') return LIMET_RANGE = 100
        if(!user.dailyAttemptsUsed && user.subscription === 'pro') return LIMET_RANGE = 50
        if(!user.dailyAttemptsUsed && user.subscription === 'free') return LIMET_RANGE = 10
    }
}
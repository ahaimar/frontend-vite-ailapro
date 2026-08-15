

export function CalculScore(scores: (number | string)){
    const nn = scores.valueOf.length;
    return 5.5 + nn;
}

export function TotalScore(scores: (number | string)[]): number {
    // Votre logique de calcul ici (ex: moyenne arrondie au .5 supérieur)
    return 5.5 + scores.length;
}


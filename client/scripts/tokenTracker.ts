// tokenTracker.ts
import fs from 'fs';
import path from 'path';

interface TokenTracking {
    lastTokenId: number;
    tokens: {
        [tokenId: number]: {
            imageHash: string;
            metadataHash: string;
            timestamp: string;
        }
    }
}

class TokenTracker {
    private readonly filePath: string;
    private tracking: TokenTracking;

    constructor() {
        this.filePath = path.join(__dirname, 'tokenTracking.json');
        this.tracking = this.loadTracking();
    }

    private loadTracking(): TokenTracking {
        try {
            if (fs.existsSync(this.filePath)) {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            }
        } catch (error) {
            console.log('No existing tracking file found, creating new one', error);
        }

        return {
            lastTokenId: 0,
            tokens: {}
        };
    }

    private saveTracking(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.tracking, null, 2));
    }

    public getNextTokenId(): number {
        return this.tracking.lastTokenId + 1;
    }

    public addToken(tokenId: number, imageHash: string, metadataHash: string): void {
        this.tracking.tokens[tokenId] = {
            imageHash,
            metadataHash,
            timestamp: new Date().toISOString()
        };
        this.tracking.lastTokenId = Math.max(this.tracking.lastTokenId, tokenId);
        this.saveTracking();
    }

    public getAllTokens(): TokenTracking['tokens'] {
        return this.tracking.tokens;
    }

    public getToken(tokenId: number) {
        return this.tracking.tokens[tokenId];
    }
}

export default TokenTracker;
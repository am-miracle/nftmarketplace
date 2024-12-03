import fs from 'fs';
import path from 'path';

interface AbiInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
  components?: AbiInput[];
}

interface AbiOutput {
  name: string;
  type: string;
  internalType?: string;
  components?: AbiOutput[];
}

interface AbiItem {
  type: string;
  name?: string;
  inputs?: AbiInput[];
  outputs?: AbiOutput[];
  stateMutability?: string;
  payable?: boolean;
  constant?: boolean;
  anonymous?: boolean;
}

interface ContractArtifact {
  abi: AbiItem[];
  bytecode: string;
  deployedBytecode: string;
  metadata: string;
}

class ABIExtractor {
  private readonly outDir: string;
  private readonly constantsDir: string;

  constructor() {
    // Look for artifacts in the parent directory's out folder
    this.outDir = path.join(process.cwd(), '..', 'out');
    this.constantsDir = path.join(process.cwd(), 'constants', 'abis');
    
    console.log('Looking for artifacts in:', this.outDir);
    console.log('Writing ABIs to:', this.constantsDir);
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.constantsDir)) {
      fs.mkdirSync(this.constantsDir, { recursive: true });
    }
  }

  private readArtifact(contractName: string): ContractArtifact {
    const artifactPath = path.join(
      this.outDir,
      `${contractName}.sol`,
      `${contractName}.json`
    );

    try {
      if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact file not found at: ${artifactPath}`);
      }
      return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    } catch (error) {
      console.error('Available files in out directory:', fs.readdirSync(this.outDir));
      throw new Error(`Failed to read artifact for ${contractName}: ${error}`);
    }
  }

  private generateTypeDefinitions(abi: AbiItem[]): string {
    const types: string[] = [];
    
    // Generate interface for function inputs
    abi.forEach(item => {
      if (item.type === 'function') {
        const functionName = item.name!;
        const inputTypes = item.inputs?.map(input => `${input.name}: ${this.solTypeToTS(input)}`).join(', ') || '';
        const outputType = this.getOutputType(item.outputs);
        
        types.push(`${functionName}(${inputTypes}): Promise<${outputType}>;`);
      }
    });

    return types.join('\n  ');
  }

  private solTypeToTS(input: AbiInput): string {
    switch (input.type) {
      case 'address':
        return 'string';
      case 'uint256':
      case 'uint8':
      case 'uint':
        return 'bigint';
      case 'bool':
        return 'boolean';
      case 'string':
        return 'string';
      case 'bytes32':
        return 'string';
      case 'tuple':
        if (input.components) {
          const componentTypes = input.components.map(comp => 
            `${comp.name}: ${this.solTypeToTS(comp)}`
          ).join(', ');
          return `{ ${componentTypes} }`;
        }
        return 'any';
      default:
        return 'any';
    }
  }

  private getOutputType(outputs?: AbiOutput[]): string {
    if (!outputs || outputs.length === 0) return 'void';
    if (outputs.length === 1) return this.solTypeToTS(outputs[0]);
    
    const outputTypes = outputs.map(output => 
      `${output.name || 'value'}: ${this.solTypeToTS(output)}`
    ).join(', ');
    return `{ ${outputTypes} }`;
  }

  public extractABI(contractName: string): void {
    try {
      this.ensureDirectoryExists();
      const artifact = this.readArtifact(contractName);
      
      // Generate the ABI file content
      const abiPath = path.join(this.constantsDir, `${contractName}.ts`);
      const content = `// Generated by scripts/extract-abis.ts
import { type ethers } from 'ethers';

export const ${contractName.toUpperCase()}_ADDRESS = process.env.NEXT_PUBLIC_${contractName.toUpperCase()}_ADDRESS as string;

export const ${contractName.toUpperCase()}_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export type ${contractName}Contract = ethers.Contract;
`;

      fs.writeFileSync(abiPath, content);
      console.log(`✅ Generated ABI for ${contractName}`);

    } catch (error) {
      console.error(`❌ Error extracting ABI for ${contractName}:`, error);
      process.exit(1);
    }
  }
}

// Execute the extraction
const extractor = new ABIExtractor();
['NFTMarketplace', 'NFTCollection'].forEach(contractName => {
  extractor.extractABI(contractName);
});
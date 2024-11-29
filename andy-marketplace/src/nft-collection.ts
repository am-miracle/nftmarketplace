import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  BaseURILocked as BaseURILockedEvent,
  BaseURIUpdated as BaseURIUpdatedEvent,
  BatchMetadataUpdate as BatchMetadataUpdateEvent,
  BatchTokensMinted as BatchTokensMintedEvent,
  MetadataUpdate as MetadataUpdateEvent,
  MetadataUpdated as MetadataUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  TokenBurned as TokenBurnedEvent,
  TokenMinted as TokenMintedEvent,
  TokenURILocked as TokenURILockedEvent,
  Transfer as TransferEvent
} from "../generated/NFTCollection/NFTCollection"
import {
  Approval,
  ApprovalForAll,
  BaseURILocked,
  BaseURIUpdated,
  BatchMetadataUpdate,
  BatchTokensMinted,
  MetadataUpdate,
  MetadataUpdated,
  OwnershipTransferred,
  TokenBurned,
  TokenMinted,
  TokenURILocked,
  Transfer
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBaseURILocked(event: BaseURILockedEvent): void {
  let entity = new BaseURILocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBaseURIUpdated(event: BaseURIUpdatedEvent): void {
  let entity = new BaseURIUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newBaseURI = event.params.newBaseURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBatchMetadataUpdate(
  event: BatchMetadataUpdateEvent
): void {
  let entity = new BatchMetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._fromTokenId = event.params._fromTokenId
  entity._toTokenId = event.params._toTokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBatchTokensMinted(event: BatchTokensMintedEvent): void {
  let entity = new BatchTokensMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.to = event.params.to
  entity.tokenIds = event.params.tokenIds
  entity.tokenURIs = event.params.tokenURIs
  entity.royaltyFee = event.params.royaltyFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMetadataUpdate(event: MetadataUpdateEvent): void {
  let entity = new MetadataUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._tokenId = event.params._tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMetadataUpdated(event: MetadataUpdatedEvent): void {
  let entity = new MetadataUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId
  entity.name = event.params.name
  entity.description = event.params.description

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenBurned(event: TokenBurnedEvent): void {
  let entity = new TokenBurned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenMinted(event: TokenMintedEvent): void {
  let entity = new TokenMinted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.tokenURI = event.params.tokenURI
  entity.royaltyFee = event.params.royaltyFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenURILocked(event: TokenURILockedEvent): void {
  let entity = new TokenURILocked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

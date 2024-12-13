import {
  AuctionEnded as AuctionEndedEvent,
  BidPlaced as BidPlacedEvent,
  BidWithdrawn as BidWithdrawnEvent,
  CategoryAdded as CategoryAddedEvent,
  EarningsWithdrawn as EarningsWithdrawnEvent,
  ItemBought as ItemBoughtEvent,
  ItemCanceled as ItemCanceledEvent,
  ItemListed as ItemListedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
} from "../generated/NFTMarketplace/NFTMarketplace"
import {
  AuctionEnded,
  BidPlaced,
  BidWithdrawn,
  CategoryAdded,
  EarningsWithdrawn,
  ItemBought,
  ItemCanceled,
  ItemListed,
  OwnershipTransferred,
  Paused,
  Unpaused,
} from "../generated/schema"

export function handleAuctionEnded(event: AuctionEndedEvent): void {
  let entity = new AuctionEnded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.winner = event.params.winner
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.seller = event.params.seller
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBidPlaced(event: BidPlacedEvent): void {
  let entity = new BidPlaced(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.bidder = event.params.bidder
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBidWithdrawn(event: BidWithdrawnEvent): void {
  let entity = new BidWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.bidder = event.params.bidder
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCategoryAdded(event: CategoryAddedEvent): void {
  let entity = new CategoryAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.category = event.params.category
  entity.name = event.params.name
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEarningsWithdrawn(event: EarningsWithdrawnEvent): void {
  let entity = new EarningsWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.seller = event.params.seller
  entity.amount = event.params.amount
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemBought(event: ItemBoughtEvent): void {
  let entity = new ItemBought(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.buyer = event.params.buyer
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.seller = event.params.seller
  entity.timestamp = event.params.timestamp
  entity.royaltyAmount = event.params.royaltyAmount
  entity.royaltyReceiver = event.params.royaltyReceiver

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemCanceled(event: ItemCanceledEvent): void {
  let entity = new ItemCanceled(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.seller = event.params.seller
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleItemListed(event: ItemListedEvent): void {
  let entity = new ItemListed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.seller = event.params.seller
  entity.nftAddress = event.params.nftAddress
  entity.tokenId = event.params.tokenId
  entity.price = event.params.price
  entity.isAuction = event.params.isAuction
  entity.category = event.params.category
  entity.timestamp = event.params.timestamp
  entity.collectionName = event.params.collectionName
  entity.creator = event.params.creator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.account = event.params.account

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

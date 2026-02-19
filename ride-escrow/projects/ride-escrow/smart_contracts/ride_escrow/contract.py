from algopy import ARC4Contract, Account, Global, Txn, UInt64, arc4, gtxn, itxn


BOOKED = 0
COMPLETED = 1
CANCELLED = 2


class RideEscrow(ARC4Contract):
    # Global state values (stored on-chain).
    driver: Account
    rider: Account
    amount: UInt64
    status: UInt64

    def __init__(self) -> None:
        self.driver = Account()
        self.rider = Account()
        self.amount = UInt64(0)
        self.status = UInt64(CANCELLED)

    @arc4.abimethod
    def book_trip(self, driver_addr: arc4.Address, pay: gtxn.PaymentTransaction) -> None:
        # Rider locks fare in app escrow and trip is marked as booked.
        assert self.status != UInt64(BOOKED)
        assert pay.receiver == Global.current_application_address
        assert pay.amount > UInt64(0)
        assert pay.sender == Txn.sender

        self.driver = driver_addr.native
        self.rider = Txn.sender
        self.amount = pay.amount
        self.status = UInt64(BOOKED)

    @arc4.abimethod
    def complete_trip(self) -> None:
        # Driver completes trip and receives escrowed ALGO.
        assert self.status == UInt64(BOOKED)
        assert Txn.sender == self.driver

        itxn.Payment(receiver=self.driver, amount=self.amount, fee=0).submit()
        self.amount = UInt64(0)
        self.status = UInt64(COMPLETED)

    @arc4.abimethod
    def cancel_trip(self) -> None:
        # Rider cancels trip and gets refunded from escrow.
        assert self.status == UInt64(BOOKED)
        assert Txn.sender == self.rider

        itxn.Payment(receiver=self.rider, amount=self.amount, fee=0).submit()
        self.amount = UInt64(0)
        self.status = UInt64(CANCELLED)

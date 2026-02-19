import logging
import algokit_utils

logger = logging.getLogger(__name__)

def deploy() -> None:
    from smart_contracts.artifacts.ride_escrow.ride_escrow_client import (
        RideEscrowFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        RideEscrowFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    print("\nDEPLOYMENT COMPLETE")
    print("Operation:", result.operation_performed)
    print("App ID:", app_client.app_id)
    print("App Address:", app_client.app_address)

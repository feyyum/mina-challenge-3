import { TestingAppChain } from "@proto-kit/sdk";
import { Character, CircuitString, Field, PrivateKey} from "o1js";
import { log } from "@proto-kit/common";
import { Message, MinaChallenge3, String12, String2 } from "../src/MinaChallenge3";

log.setLevel("ERROR");

describe("MinaChallenge3", () => {
    const appChain = TestingAppChain.fromRuntime({
        modules: {
            MinaChallenge3,
        },
    });
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    let minaChallenge3: MinaChallenge3;
    beforeAll(async () => {
        appChain.configurePartial({
            Runtime: {
                MinaChallenge3: {
                    maxMessageChars: Field(12),
                },
            },
        });

        await appChain.start();

        appChain.setSigner(alicePrivateKey);

        minaChallenge3 = appChain.runtime.resolve("MinaChallenge3");
    });
    it("should populate agents", async () => {
        const tx0 = await appChain.transaction(alice, () => {
            minaChallenge3.populateAgents();
        });
        
        await tx0.sign();
        await tx0.send();
        const block1 = await appChain.produceBlock();

        const agentState = await appChain.query.runtime.MinaChallenge3.agentStates.get(Field(1));
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        console.log(agentState?.lastMessageNumber, agentState?.securityCode)
        expect(agentState?.lastMessageNumber.toBigInt()).toBe(BigInt(0));
        expect(agentState?.securityCode.toString()).toBe("12");
    });
    it("should process message if valid", async () => {
        const mock_message: Message = new Message(
            Field(1),
            String12.fromString("Hello, World"),
            Field(1),
            String2.fromString("12"));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge3.IsMessageValid(mock_message);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        
        const tx = await appChain.transaction(alice, () => {
            minaChallenge3.submitMessage(mock_message);
        });

        await tx.sign();
        await tx.send();

        const block2 = await appChain.produceBlock();

        const agentStateAfterSubmitMessage = await appChain.query.runtime.MinaChallenge3.agentStates.get(Field(1));

        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentStateAfterSubmitMessage?.lastMessageNumber.toBigInt()).toBe(BigInt(1));
        expect(agentStateAfterSubmitMessage?.securityCode.toString()).toBe("12");
    }, 1_000_000);
    it("should fail if message is invalid", async () => {
        const mock_message: Message = new Message(
            Field(2),
            String12.fromString("Hello, Sorlo"),
            Field(1),
            String2.fromString("12"));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge3.IsMessageValid(mock_message);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message2: Message = new Message(
            Field(4),
            String12.fromString("Hello, World"),
            Field(1),
            String2.fromString("34"));
        const tx2 = await appChain.transaction(alice, () => {
            minaChallenge3.IsMessageValid(mock_message2);
        });
        await tx2.sign();
        await tx2.send();
        const block2 = await appChain.produceBlock();
        console.log(block2?.transactions[0]);
        expect(block2?.transactions[0].status.toBoolean()).toBe(false);
    }, 1_000_000);
    it("should succesfully submit multiple messages", async () => {
        const mock_message: Message = new Message(
            Field(5),
            String12.fromString("Hello, World"),
            Field(1),
            String2.fromString("12"));
        const tx1 = await appChain.transaction(alice, () => {
            minaChallenge3.submitMessage(mock_message);
        });
        await tx1.sign();
        await tx1.send();
        const block1 = await appChain.produceBlock();
        console.log(block1?.transactions[0]);
        expect(block1?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message2: Message = new Message(
            Field(6),
            String12.fromString("Hello, World"),
            Field(1),
            String2.fromString("12"));
        const tx2 = await appChain.transaction(alice, () => {
            minaChallenge3.submitMessage(mock_message2);
        });
        await tx2.sign();
        await tx2.send();
        const block2 = await appChain.produceBlock();
        console.log(block2?.transactions[0]);
        expect(block2?.transactions[0].status.toBoolean()).toBe(true);
        
        const mock_message3: Message = new Message(
            Field(8),
            String12.fromString("Hello, World"),
            Field(1),
            String2.fromString("12"));
        const tx3 = await appChain.transaction(alice, () => {
            minaChallenge3.submitMessage(mock_message3);
        });
        await tx3.sign();
        await tx3.send();
        const block3 = await appChain.produceBlock();
        console.log(block3?.transactions[0]);
        expect(block3?.transactions[0].status.toBoolean()).toBe(true);
        
        const agentStateAfterSubmitMessage = await appChain.query.runtime.MinaChallenge3.agentStates.get(Field(1));
        expect(agentStateAfterSubmitMessage?.lastMessageNumber.toBigInt()).toBe(BigInt(8));
        expect(agentStateAfterSubmitMessage?.securityCode.toString()).toBe("12");
    });
});

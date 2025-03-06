import { Economy } from '../../lib/economy';

const economy = new Economy(); // Defaults: 10 balance, "Pokèdollars" as currency

/*
  Pokémon Showdown chat-plugins expect commands to be attached to an exports.commands object.
  The /balance command remains top-level, while all other economy-related commands are nested under /eco.
  The global function toID is assumed to be available.
*/
export const commands: { [command: string]: any } = {
  // Top-level command: /balance (shows caller's balance)
  async balance(target: string, room: any, user: any) {
    try {
		 this.checkBroadcast();
      const balance = await economy.getBalance(user.userid);
      const currency = economy.getCurrencyName();
      this.sendReply(`Your current balance is ${balance} ${currency}.`);
    } catch (error: any) {
      this.sendReply(`Error: ${error.message}`);
    }
  },

  // Nested economy commands under /eco
  eco: {
    // /eco help - displays help for economy commands
    async help(target: string, room: any, user: any) {
      this.sendReply(
        "Economy Commands:\n" +
        "/balance - Show your balance.\n" +
        "/eco give [target user] [amount] - Give funds to a user (leader+ only).\n" +
        "/eco take [target user] [amount] - Take funds from a user (leader+ only).\n" +
        "/eco transfer [target user] [amount] - Transfer funds from you to a user.\n" +
        "/eco hasbalance [amount] - Check if you have at least the specified amount.\n" +
        "/eco deleteuser [target user] - Delete the account of a user (leader+ only).\n" +
        "/eco cleardata - Delete all economy data (leader+ only).\n" +
        "/eco setcurrency [new currency name] - Change the global currency name (leader+ only)."
      );
    },

    // /eco give [target user] [amount]
    async give(target: string, room: any, user: any) {
      try {
        this.checkCan('bypassall');
      } catch (e) {
        return this.sendReply("Permission denied.");
      }
      const parts = target.trim().split(/\s+/);
      if (parts.length !== 2) {
        return this.sendReply("Usage: /eco give [target user] [amount]");
      }
      const targetUser = parts[0];
      const amount = parseInt(parts[1], 10);
      if (!targetUser || isNaN(amount)) {
        return this.sendReply("Usage: /eco give [target user] [amount]");
      }
      try {
        const account = await economy.give(targetUser, amount);
        const currency = economy.getCurrencyName();
        this.sendReply(`Gave ${amount} ${currency} to ${targetUser}. New balance for ${targetUser}: ${account.balance} ${currency}`);
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },

    // /eco take [target user] [amount]
    async take(target: string, room: any, user: any) {
      try {
        this.checkCan('bypassall');
      } catch (e) {
        return this.sendReply("Permission denied.");
      }
      const parts = target.trim().split(/\s+/);
      if (parts.length !== 2) {
        return this.sendReply("Usage: /eco take [target user] [amount]");
      }
      const targetUser = parts[0];
      const amount = parseInt(parts[1], 10);
      if (!targetUser || isNaN(amount)) {
        return this.sendReply("Usage: /eco take [target user] [amount]");
      }
      try {
        const account = await economy.take(targetUser, amount);
        const currency = economy.getCurrencyName();
        this.sendReply(`Took ${amount} ${currency} from ${targetUser}. New balance for ${targetUser}: ${account.balance} ${currency}`);
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },

    // /eco transfer [target user] [amount]
    async transfer(target: string, room: any, user: any) {
      const parts = target.trim().split(/\s+/);
      if (parts.length !== 2) {
        return this.sendReply("Usage: /eco transfer [target user] [amount]");
      }
      const targetUser = parts[0];
      const amount = parseInt(parts[1], 10);
      if (!targetUser || isNaN(amount)) {
        return this.sendReply("Usage: /eco transfer [target user] [amount]");
      }
      try {
        const normalizedTarget = toID(targetUser);
        const result = await economy.transfer(user.userid, normalizedTarget, amount);
        const currency = economy.getCurrencyName();
        this.sendReply(`You have transferred ${amount} ${currency} to ${targetUser}. Your new balance: ${result.from.balance} ${currency}`);
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },

    // /eco deleteuser [target user]
    async deleteuser(target: string, room: any, user: any) {
      try {
        this.checkCan('bypassall');
      } catch (e) {
        return this.sendReply("Permission denied.");
      }
      if (!target) {
        return this.sendReply("Usage: /eco deleteuser [target user]");
      }
      const targetUserid = toID(target.trim());
      try {
        await economy.deleteAccount(targetUserid);
        this.sendReply(`Account for '${targetUserid}' has been deleted.`);
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },

    // /eco cleardata - Delete all economy data.
    async cleardata(target: string, room: any, user: any) {
      try {
        this.checkCan('bypassall');
      } catch (e) {
        return this.sendReply("Permission denied.");
      }
      try {
        await economy.deleteAllData();
        this.sendReply("All economy data has been deleted.");
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },

    // /eco setcurrency [new currency name]
    async setcurrency(target: string, room: any, user: any) {
      try {
        this.checkCan('bypassall');
      } catch (e) {
        return this.sendReply("Permission denied.");
      }
      if (!target) {
        return this.sendReply("Usage: /eco setcurrency [new currency name]");
      }
      try {
        await economy.setCurrencyName(target.trim());
        this.sendReply(`Currency name has been changed to "${target.trim()}".`);
      } catch (error: any) {
        this.sendReply(`Error: ${error.message}`);
      }
    },
  },

  // Alias /economy to /eco
  economy: 'eco',
};
                                                   

import storage from 'node-persist';

export interface Account {
  userid: string;       // The original username as provided
  normalizedId: string; // The normalized version (using toID)
  balance: number;
}

export class Economy {
  private defaultBalance: number;
  private currencyName: string;
  private currencyKey: string = '__global_currency__';

  constructor(defaultBalance: number = 0, currencyName: string = 'coins') {
    this.defaultBalance = defaultBalance;
    this.currencyName = currencyName;
    this.initStorage();
  }

  // Initialize node-persist storage and load the global currency name.
  private async initStorage(): Promise<void> {
    try {
      await storage.init({
        dir: '../persist',
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false,
        continuous: true,
        ttl: false,
      });
      // Load the globally stored currency name if it exists.
      const storedCurrency = await storage.getItem(this.currencyKey);
      if (storedCurrency !== undefined) {
        this.currencyName = storedCurrency;
      } else {
        await storage.setItem(this.currencyKey, this.currencyName);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  // Change the global currency name and persist it.
  public async setCurrencyName(newName: string): Promise<void> {
    this.currencyName = newName;
    await storage.setItem(this.currencyKey, newName);
  }

  // Retrieve the current currency name.
  public getCurrencyName(): string {
    return this.currencyName;
  }

  // Retrieve an account or create one with the default balance.
  public async getAccount(userid: string): Promise<Account> {
    // toID is assumed to be available globally.
    const normalizedId = toID(userid);
    let account = await storage.getItem(normalizedId);
    if (!account) {
      account = { userid, normalizedId, balance: this.defaultBalance };
      await storage.setItem(normalizedId, account);
    }
    return account;
  }

  // Get a user's current balance.
  public async getBalance(userid: string): Promise<number> {
    const account = await this.getAccount(userid);
    return account.balance;
  }

  // Check if a user has at least a specified amount.
  public async hasBalance(userid: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userid);
    return balance >= amount;
  }

  // Give funds to a user.
  public async give(userid: string, amount: number): Promise<Account> {
    const account = await this.getAccount(userid);
    account.balance += amount;
    await storage.setItem(account.normalizedId, account);
    return account;
  }

  // Take funds from a user.
  public async take(userid: string, amount: number): Promise<Account> {
    const account = await this.getAccount(userid);
    if (account.balance < amount) {
      throw new Error('Insufficient funds');
    }
    account.balance -= amount;
    await storage.setItem(account.normalizedId, account);
    return account;
  }

  // Transfer funds between two users.
  public async transfer(fromUserid: string, toUserid: string, amount: number): Promise<{ from: Account; to: Account }> {
    const fromAccount = await this.getAccount(fromUserid);
    const toAccount = await this.getAccount(toUserid);
    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds for transfer');
    }
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    await storage.setItem(fromAccount.normalizedId, fromAccount);
    await storage.setItem(toAccount.normalizedId, toAccount);
    return { from: fromAccount, to: toAccount };
  }

  // Delete a specific user's account.
  public async deleteAccount(userid: string): Promise<void> {
    const normalizedId = toID(userid);
    await storage.removeItem(normalizedId);
  }

  // Delete all stored economy data.
  public async deleteAllData(): Promise<void> {
    await storage.clear();
  }
}

import { test, expect } from '@playwright/test';

test.describe('AuxQueue E2E Features', () => {
  
  test('Scenario 1: User can successfully join a party using a code', async ({ page }) => {
    await page.goto('/party/join');
    await page.fill('input[id="partyCode"]', 'ABC123');
    await page.click('button:has-text("Join Party")');
    await expect(page).toHaveURL(/\/party\/ABC123\/queue/);
    await expect(page.locator('text=Code: ABC123')).toBeVisible();
  });

  test('Scenario 2: User can add a song to the live queue', async ({ page }) => {
    await page.goto('/party/ABC123/queue');
    await page.click('button:has-text("Add Song")');
    await page.fill('input[placeholder="Song title"]', 'Bohemian Rhapsody');
    await page.fill('input[placeholder="Artist"]', 'Queen');
    await page.click('button:has-text("Add to Queue")');
    await expect(page.locator('text=Bohemian Rhapsody')).toBeVisible();
  });

  test('Scenario 3: User can upvote a song and change its score', async ({ page }) => {
    await page.goto('/party/ABC123/queue');
    const firstUpvoteBtn = page.locator('button:has(.lucide-chevron-up)').first();
    const voteCountElement = page.locator('.text-\\[\\#1DB954\\]').nth(1);
    
    const initialVotes = await voteCountElement.innerText();
    await firstUpvoteBtn.click();
    const newVotes = await voteCountElement.innerText();
    
    expect(parseInt(newVotes)).toBeGreaterThan(parseInt(initialVotes));
  });
});
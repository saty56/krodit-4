# Code Review Guide with CodeRabbit

This guide explains how to use CodeRabbit for automated code reviews in this project.

## What is CodeRabbit?

CodeRabbit is an AI-powered code review tool that automatically reviews your pull requests on GitHub. It provides:
- Code quality checks
- Security vulnerability detection
- Performance suggestions
- Best practices recommendations
- Documentation checks

## Setup Instructions

### 1. Install CodeRabbit

1. Go to [CodeRabbit.ai](https://coderabbit.ai)
2. Sign in with your GitHub account
3. Click "Install CodeRabbit"
4. Or go directly to [GitHub Marketplace](https://github.com/marketplace/coderabbitai)
5. Select your organization/personal account
6. Choose repositories (all or specific)
7. Click "Install"

### 2. Configure for This Repository

The repository already includes a `.coderabbit.yaml` configuration file that:
- Focuses on TypeScript/React/Next.js best practices
- Excludes build artifacts and dependencies
- Checks for code quality, security, and performance
- Provides project-specific guidance

### 3. Using CodeRabbit in Pull Requests

#### Automatic Reviews
- CodeRabbit automatically reviews PRs when they're opened
- Reviews are posted as comments on the PR
- You'll see suggestions for improvements

#### Manual Review Trigger
If you want to trigger a review manually, comment on your PR:
```
/review
```

#### Request Specific Review
You can ask CodeRabbit to focus on specific areas:
```
/review security
/review performance
/review documentation
```

### 4. Understanding CodeRabbit Comments

CodeRabbit provides different types of feedback:

#### 🔴 Critical Issues
- Security vulnerabilities
- Potential bugs
- Breaking changes

#### 🟡 Suggestions
- Code improvements
- Best practices
- Performance optimizations

#### 🟢 Informational
- Documentation suggestions
- Code style recommendations
- Alternative approaches

### 5. Responding to Reviews

#### Apply Suggestions
- Review each suggestion carefully
- Apply fixes directly from CodeRabbit's suggestions
- Update your code and push changes

#### Ask Questions
You can reply to CodeRabbit's comments to:
- Ask for clarification
- Request more details
- Discuss alternatives

#### Dismiss Suggestions
If a suggestion doesn't apply:
- Explain why in a comment
- CodeRabbit will learn from your feedback

### 6. Best Practices

1. **Review Early**: Create PRs early to get feedback during development
2. **Address Critical Issues**: Fix security and bug issues first
3. **Consider Suggestions**: Evaluate each suggestion for your use case
4. **Learn from Reviews**: Use reviews to improve your coding skills
5. **Keep PRs Small**: Smaller PRs get more focused reviews

### 7. Configuration

The `.coderabbit.yaml` file can be customized for:
- Review depth (quick/balanced/comprehensive)
- Paths to include/exclude
- Specific checks to enable/disable
- Custom instructions for your project

### 8. Integration with Other Tools

CodeRabbit works alongside:
- GitHub Actions
- ESLint
- TypeScript compiler
- Other CI/CD tools

## Example Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/new-subscription-form
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "Add subscription form component"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/new-subscription-form
   ```
   Then create a PR on GitHub

4. **CodeRabbit Reviews Automatically**
   - Wait a few minutes
   - Check PR comments for CodeRabbit's review

5. **Address Feedback**
   - Review suggestions
   - Make necessary changes
   - Push updates

6. **Merge When Ready**
   - Once all feedback is addressed
   - Get team approval
   - Merge the PR

## Tips for Better Reviews

- **Write Clear PR Descriptions**: Help CodeRabbit understand context
- **Keep PRs Focused**: One feature per PR
- **Add Tests**: CodeRabbit can review test coverage
- **Update Documentation**: Keep README and docs updated
- **Follow Project Patterns**: Use existing code structure

## Troubleshooting

### CodeRabbit Not Reviewing
- Check if it's installed on the repository
- Verify `.coderabbit.yaml` exists
- Check repository settings in CodeRabbit dashboard

### Too Many Suggestions
- Adjust review depth in `.coderabbit.yaml`
- Exclude specific paths
- Disable specific check types

### Missing Reviews
- Ensure PRs are not in draft mode
- Check CodeRabbit service status
- Try manual `/review` command

## Resources

- [CodeRabbit Documentation](https://docs.coderabbit.ai)
- [GitHub Marketplace](https://github.com/marketplace/coderabbitai)
- [CodeRabbit Support](https://coderabbit.ai/support)

## Questions?

If you have questions about CodeRabbit or code reviews:
1. Check the CodeRabbit documentation
2. Ask in team chat
3. Review previous PRs for examples


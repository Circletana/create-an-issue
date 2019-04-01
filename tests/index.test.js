const path = require('path')
const mockdate = require('mockdate')
const { Toolkit } = require('actions-toolkit')

describe('create-an-issue', () => {
  let actionFn, tools

  beforeEach(() => {
    mockdate.set(1554126555814)
    Toolkit.run = jest.fn(fn => { actionFn = fn })
    require('..')

    Object.assign(process.env, {
      GITHUB_EVENT_PATH: path.join(__dirname, 'fixtures', 'event.json'),
      GITHUB_WORKSPACE: path.join(__dirname, 'fixtures')
    })

    tools = new Toolkit({ logger: {
      info: jest.fn(),
      success: jest.fn(),
      warn: jest.fn()
    } })
    tools.github = {
      issues: {
        create: jest.fn(({ title }) => Promise.resolve({ data: {
          title,
          number: 1,
          html_url: 'www'
        } }))
      }
    }
    tools.exit.success = jest.fn()
    tools.exit.failure = jest.fn()
  })

  it('creates a new issue', async () => {
    tools.log.success = jest.fn()
    await actionFn(tools)
    expect(tools.github.issues.create).toHaveBeenCalled()
    expect(tools.github.issues.create.mock.calls).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect(tools.log.success.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue from a different template', async () => {
    tools.arguments._ = ['.github/different-template.md']
    tools.workspace = path.join(__dirname, 'fixtures')
    tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    await actionFn(tools)
    expect(tools.github.issues.create).toHaveBeenCalled()
    expect(tools.github.issues.create.mock.calls[0][0].title).toBe('Different file')
  })

  it('creates a new issue with some template variables', async () => {
    tools.arguments._[0] = '.github/variables.md'
    await actionFn(tools)
    expect(tools.github.issues.create).toHaveBeenCalled()
    expect(tools.github.issues.create.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees, labels and a milestone', async () => {
    tools.arguments._[0] = '.github/kitchen-sink.md'
    await actionFn(tools)
    expect(tools.github.issues.create).toHaveBeenCalled()
    expect(tools.github.issues.create.mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with dates', async () => {
    tools.arguments._[0] = '.github/dates.md'
    await actionFn(tools)
    expect(tools.github.issues.create).toHaveBeenCalled()
    expect(tools.github.issues.create.mock.calls).toMatchSnapshot()
  })

  afterEach(() => {
    mockdate.reset()
  })
})

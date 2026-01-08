import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfileForm from "@/components/profile-form"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: "user-123" } },
    update: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe("ProfileForm", () => {
  const mockUser = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    image: null,
    phone: null,
    phoneVerified: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render profile form", () => {
    render(<ProfileForm user={mockUser} />)

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
  })

  it("should update profile successfully", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { ...mockUser, name: "Updated Name" },
      }),
    })

    render(<ProfileForm user={mockUser} />)

    const nameInput = screen.getByLabelText(/display name/i)
    await user.clear(nameInput)
    await user.type(nameInput, "Updated Name")

    const submitButton = screen.getByRole("button", { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings/profile",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Name",
            phone: null,
          }),
        })
      )
    })
  })

  it("should display error message on failure", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: "Update failed",
      }),
    })

    render(<ProfileForm user={mockUser} />)

    const submitButton = screen.getByRole("button", { name: /save changes/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeInTheDocument()
    })
  })
})


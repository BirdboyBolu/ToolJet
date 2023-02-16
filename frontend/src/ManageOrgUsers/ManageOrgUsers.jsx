import React from 'react';
import { authenticationService, organizationService, organizationUserService } from '@/_services';
import { toast } from 'react-hot-toast';
import ReactTooltip from 'react-tooltip';
import { withTranslation } from 'react-i18next';
import urlJoin from 'url-join';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import UsersTable from '../../ee/components/UsersPage/UsersTable';
import UsersFilter from '../../ee/components/UsersPage/UsersFilter';
import { ButtonSolid } from '../_components/AppButton';
// import { ButtonSolid } from '../_ui/AppButton/AppButton';
import Drawer from '@/_ui/Drawer';

class ManageOrgUsersComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUser: authenticationService.currentUserValue,
      isLoading: true,
      showNewUserForm: false,
      showUploadUserForm: false,
      creatingUser: false,
      uploadingUsers: false,
      newUser: {},
      archivingUser: null,
      unarchivingUser: null,
      fields: {},
      errors: {},
      meta: {
        total_count: 0,
      },
      currentPage: 1,
      options: {},
      file: null,
    };
  }

  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  handleValidation() {
    let fields = this.state.fields;
    let errors = {};
    if (!fields['firstName']) {
      errors['firstName'] = 'This field is required';
    }
    if (!fields['lastName']) {
      errors['lastName'] = 'This field is required';
    }
    if (!fields['email']) {
      errors['email'] = 'This field is required';
    } else if (!this.validateEmail(fields['email'])) {
      errors['email'] = 'Email is not valid';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  handleFileValidation() {
    let errors = {};
    if (!this.state.file) {
      errors['file'] = 'This field is required';
    }

    this.setState({ errors: errors });
    return Object.keys(errors).length === 0;
  }

  componentDidMount() {
    this.fetchUsers(1);
  }

  fetchUsers = (page = 1, options = {}) => {
    this.setState({
      options,
      isLoading: true,
      currentPage: page,
    });

    organizationService.getUsers(page, options).then((data) => {
      this.setState({
        users: data.users,
        meta: data.meta,
        isLoading: false,
      });
    });
  };

  changeNewUserOption = (name, e) => {
    let fields = this.state.fields;
    fields[name] = e.target.value;

    this.setState({
      fields,
    });
  };

  archiveOrgUser = (id) => {
    this.setState({ archivingUser: id });

    organizationUserService
      .archive(id)
      .then(() => {
        toast.success('The user has been archived');
        this.setState({ archivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({ archivingUser: null });
      });
  };

  unarchiveOrgUser = (id) => {
    this.setState({ unarchivingUser: id });

    organizationUserService
      .unarchive(id)
      .then(() => {
        toast.success('The user has been unarchived');
        this.setState({ unarchivingUser: null });
        this.fetchUsers(this.state.currentPage, this.state.options);
      })
      .catch(({ error }) => {
        toast.error(error);
        this.setState({ unarchivingUser: null });
      });
  };

  inviteBulkUsers = (event) => {
    event.preventDefault();
    if (this.handleFileValidation()) {
      const token = this.state.currentUser.auth_token;
      const formData = new FormData();
      this.setState({
        uploadingUsers: true,
      });

      formData.append('file', this.state.file);
      organizationUserService
        .inviteBulkUsers(formData, token)
        .then((res) => {
          toast.success(res.message, {
            position: 'top-center',
          });
          this.fetchUsers();
          this.setState({
            uploadingUsers: false,
            showUploadUserForm: false,
            file: null,
          });
        })
        .catch(({ error }) => {
          toast.error(error, { position: 'top-center' });
          this.setState({ uploadingUsers: false });
        });
    }
  };

  handleFileChange = (file) => {
    this.setState({ file });
  };

  createUser = (event) => {
    event.preventDefault();

    if (this.handleValidation()) {
      if (!this.state.fields.firstName?.trim() || !this.state.fields.lastName?.trim()) {
        toast.error('First and last name should not be empty');
        return;
      }

      let fields = {};
      Object.keys(this.state.fields).map((key) => {
        fields[key] = '';
      });

      this.setState({
        creatingUser: true,
      });

      organizationUserService
        .create(
          this.state.fields.firstName,
          this.state.fields.lastName,
          this.state.fields.email,
          this.state.fields.role
        )
        .then(() => {
          toast.success('User has been created');
          this.fetchUsers();
          this.setState({
            creatingUser: false,
            showNewUserForm: false,
            fields: fields,
          });
        })
        .catch(({ error }) => {
          toast.error(error);
          this.setState({ creatingUser: false });
        });
    } else {
      this.setState({ creatingUser: false, showNewUserForm: true, file: null });
    }
  };

  generateInvitationURL = (user) => {
    if (user.account_setup_token) {
      return urlJoin(
        window.public_config?.TOOLJET_HOST,
        `/invitations/${user.account_setup_token}/workspaces/${user.invitation_token}?oid=${this.state.currentUser.organization_id}`
      );
    }
    return urlJoin(
      window.public_config?.TOOLJET_HOST,
      `/organization-invitations/${user.invitation_token}?oid=${this.state.currentUser.organization_id}`
    );
  };

  invitationLinkCopyHandler = () => {
    toast.success('Invitation URL copied');
  };

  pageChanged = (page) => {
    this.fetchUsers(page, this.state.options);
  };

  filterList = (options) => {
    this.fetchUsers(1, options);
  };
  setShowNewUserForm = () => {
    this.setState({ showUploadUserForm: false });
  };

  render() {
    const {
      isLoading,
      showNewUserForm,
      showUploadUserForm,
      creatingUser,
      uploadingUsers,
      users,
      archivingUser,
      unarchivingUser,
      meta,
    } = this.state;
    return (
      <ErrorBoundary showFallback={true}>
        <div className="wrapper org-users-page animation-fade">
          <ReactTooltip type="dark" effect="solid" delayShow={250} />

          <div className="page-wrapper">
            <div className="container-xl">
              <div className="page-header workspace-page-header d-print-none">
                <div className="row align-items-center">
                  <div className="col">
                    <div className="tj-text-sm-bold">{users?.length} users</div>
                  </div>
                  <div className="d-print-none workspace-setting-buttons-wrap">
                    {!showNewUserForm && !showUploadUserForm && (
                      <ButtonSolid
                        data-cy="invite-new-user"
                        variant="tertiary"
                        className="singleuser-btn"
                        onClick={() => this.setState({ showNewUserForm: true })}
                      >
                        {this.props.t('header.organization.menus.manageUsers.inviteNewUser', 'Invite one user')}
                      </ButtonSolid>
                    )}
                    {!showUploadUserForm && !showNewUserForm && (
                      <ButtonSolid
                        variant="primary"
                        className="multiuser-btn"
                        onClick={() => this.setState({ showUploadUserForm: true })}
                      >
                        Invite multiple users
                      </ButtonSolid>
                    )}
                  </div>
                </div>
              </div>

              <div className="worskpace-setting-table-gap">
                {showNewUserForm && (
                  <Drawer
                    disableFocus={true}
                    isOpen={showNewUserForm}
                    onClose={() => this.setShowNewUserForm()}
                    position="right"
                    className="drawer-card-wrap"
                  >
                    <div className="container-xl animation-fade">
                      <div className="drawer-card-wrap">
                        <div className="card-header">
                          <h3 className="card-title" data-cy="add-new-user">
                            {this.props.t('header.organization.menus.manageUsers.addNewUser', 'Add new user')}
                          </h3>
                        </div>
                        <div className="card-body">
                          <form onSubmit={this.createUser} noValidate>
                            <div className="form-group mb-3 ">
                              <div className="row">
                                <div className="col">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder={this.props.t(
                                      'header.organization.menus.manageUsers.enterFirstName',
                                      'Enter First Name'
                                    )}
                                    name="firstName"
                                    onChange={this.changeNewUserOption.bind(this, 'firstName')}
                                    value={this.state.fields['firstName']}
                                    data-cy="first-name-input"
                                  />
                                  <span className="text-danger" data-cy="first-name-error">
                                    {this.state.errors['firstName']}
                                  </span>
                                </div>
                                <div className="col">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder={this.props.t(
                                      'header.organization.menus.manageUsers.enterLastName',
                                      'Enter Last Name'
                                    )}
                                    name="lastName"
                                    onChange={this.changeNewUserOption.bind(this, 'lastName')}
                                    value={this.state.fields['lastName']}
                                    data-cy="last-name-input"
                                  />
                                  <span className="text-danger" data-cy="last-name-error">
                                    {this.state.errors['lastName']}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="form-group mb-3 ">
                              <label className="form-label" data-cy="email-label">
                                {this.props.t('header.organization.menus.manageUsers.emailAddress', 'Email Address')}
                              </label>
                              <div>
                                <input
                                  type="text"
                                  className="form-control"
                                  aria-describedby="emailHelp"
                                  placeholder={this.props.t(
                                    'header.organization.menus.manageUsers.enterEmail',
                                    'Enter Email'
                                  )}
                                  name="email"
                                  onChange={this.changeNewUserOption.bind(this, 'email')}
                                  value={this.state.fields['email']}
                                  data-cy="email-input"
                                />
                                <span className="text-danger" data-cy="email-error">
                                  {this.state.errors['email']}
                                </span>
                              </div>
                            </div>
                            <div className="form-footer">
                              <button
                                type="button"
                                className="btn btn-light mr-2"
                                onClick={() =>
                                  this.setState({
                                    showNewUserForm: false,
                                    newUser: {},
                                    errors: {},
                                    fields: {},
                                  })
                                }
                                data-cy="cancel-button"
                              >
                                {this.props.t('globals.cancel', 'Cancel')}
                              </button>
                              <button
                                type="submit"
                                className={`btn mx-2 btn-primary ${creatingUser ? 'btn-loading' : ''}`}
                                disabled={creatingUser}
                                data-cy="create-user-button"
                              >
                                {this.props.t('header.organization.menus.manageUsers.createUser', 'Create User')}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </Drawer>
                )}

                {showUploadUserForm && (
                  <Drawer
                    disableFocus={true}
                    isOpen={showUploadUserForm}
                    onClose={() => this.setshowUploadUserForm(false)}
                    position="right"
                    className="drawer-card-wrap"
                  >
                    <div className="container-xl">
                      <div className="drawer-card-wrap">
                        <div className="card-header">
                          <h3 className="card-title" data-cy="add-new-user">
                            Upload Users
                          </h3>
                        </div>
                        <div className="card-body">
                          <form onSubmit={this.inviteBulkUsers} noValidate>
                            <div className="form-group mb-3 ">
                              <div className="row">
                                <div className="col-6">
                                  <input
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (Math.round(file.size / 1024) > 1024) {
                                        toast.error('File size cannot exceed more than 1MB');
                                        e.target.value = null;
                                      } else {
                                        this.handleFileChange(file);
                                      }
                                    }}
                                    accept=".csv"
                                    type="file"
                                    className="form-control"
                                  />
                                  <span className="text-danger" data-cy="file-error">
                                    {this.state.errors['file']}
                                  </span>
                                </div>
                                <div className="col-6">
                                  <a
                                    className="btn btn-primary"
                                    role="button"
                                    href="../../assets/csv/sample_upload.csv"
                                    download="sample_upload.csv"
                                  >
                                    Download Template
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div className="form-footer">
                              <button
                                type="button"
                                className="btn btn-light mr-2"
                                onClick={() =>
                                  this.setState({
                                    showUploadUserForm: false,
                                    errors: {},
                                    file: null,
                                  })
                                }
                                data-cy="cancel-button"
                              >
                                {this.props.t('globals.cancel', 'Cancel')}
                              </button>
                              <button
                                type="submit"
                                className={`btn mx-2 btn-primary ${uploadingUsers ? 'btn-loading' : ''}`}
                                disabled={uploadingUsers}
                                data-cy="create-users-button"
                              >
                                Create Users
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </Drawer>
                )}
                <div className="workspace-setting-table-wrapper">
                  {!showNewUserForm && !showUploadUserForm && (
                    <UsersFilter
                      filterList={this.filterList}
                      darkMode={this.props.darkMode}
                      clearIconPressed={() => this.fetchUsers()}
                    />
                  )}
                  <div className="liner"></div>

                  {users?.length === 0 && !showNewUserForm && !showUploadUserForm && (
                    <div className="d-flex justify-content-center flex-column">
                      <span className="text-center pt-5 font-weight-bold">No result found</span>
                      <small className="text-center text-muted">Try changing the filters</small>
                    </div>
                  )}

                  {!showNewUserForm && !showUploadUserForm && users?.length !== 0 && (
                    <UsersTable
                      isLoading={isLoading}
                      users={users}
                      unarchivingUser={unarchivingUser}
                      archivingUser={archivingUser}
                      meta={meta}
                      generateInvitationURL={this.generateInvitationURL}
                      invitationLinkCopyHandler={this.invitationLinkCopyHandler}
                      unarchiveOrgUser={this.unarchiveOrgUser}
                      archiveOrgUser={this.archiveOrgUser}
                      pageChanged={this.pageChanged}
                      darkMode={this.props.darkMode}
                      translator={this.props.t}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export const ManageOrgUsers = withTranslation()(ManageOrgUsersComponent);

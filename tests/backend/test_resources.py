def test_get_resources(client, init_db):
    response = client.get('/api/resources/')
    assert response.status_code == 200
    assert response.json['success'] is True
    assert 'resources' in response.json

def test_create_resource(client, auth_headers):
    response = client.post('/api/resources/', json={
        "title": "Test Resource",
        "description": "Test description",
        "category_id": 1,
        "listing_type": "FREE",
        "sharing_type": "LEND",
        "condition": "GOOD"
    }, headers=auth_headers)
    assert response.status_code == 201
    assert response.json['success'] is True

def test_unauthorized_create(client):
    response = client.post('/api/resources/', json={
        "title": "Test Resource",
        "description": "Test description",
        "category_id": 1
    })
    assert response.status_code == 401
